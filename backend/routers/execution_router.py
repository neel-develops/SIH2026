"""Block execution lifecycle — the field-to-control-room loop.

    SCHEDULED  →  IN_PROGRESS  →  PARTIALLY_DONE  →  COMPLETED
                                        │
                                        └─► AI carry-forward creates the
                                            follow-up block automatically

A block is "granted" when the section controller hands the line over
(disconnection taken). Progress is reported per defect, so a block that runs out
of time can be handed back partially complete without losing the outstanding
work — the rescheduler re-optimises it into the next-best traffic window.
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import Defect, BlockWindow, BlockPlan, Block, AuditLog, User
from schemas import (
    BlockOut, StartBlockRequest, ProgressUpdateRequest,
    PartialCompleteRequest, CompleteBlockRequest, LiveExecutionOut,
)
from services.ai_engine import reschedule_carry_forward, MAX_CARRY_FORWARD_GENERATION

router = APIRouter(prefix="/api/v1/execution", tags=["execution"])

# Roles permitted to operate a block on the ground.
FIELD_ROLES = {
    "SUPER_ADMIN", "ZONAL_ADMIN", "DIVISIONAL_BLOCK_PLANNER", "SENIOR_OFFICER",
    "SSE_ENGINEERING", "SSE_SIGNAL_TELECOM", "SSE_TRACTION_DISTRIBUTION",
    "JUNIOR_ENGINEER",
}


def _require_field_role(user: User):
    if user.role not in FIELD_ROLES:
        raise HTTPException(
            status_code=403,
            detail=f"Role {user.role} cannot operate blocks in the field",
        )


def _log(block: Block, event: str, actor: str, detail: str, **extra):
    """Append an immutable entry to the block's execution timeline."""
    entry = {
        "event": event,
        "actor": actor,
        "detail": detail,
        "at": datetime.utcnow().isoformat(),
        **extra,
    }
    # JSON columns need reassignment for SQLAlchemy to detect the mutation.
    block.execution_log = list(block.execution_log or []) + [entry]
    return entry


def _get_block(db: Session, block_id: str) -> Block:
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Block {block_id} not found")
    return block


def _elapsed_hrs(block: Block, until: datetime | None = None) -> float:
    if not block.actual_start:
        return 0.0
    end = until or datetime.utcnow()
    return max(0.0, (end - block.actual_start).total_seconds() / 3600)


# ── 1. START ─────────────────────────────────────────────────────────────────

@router.post("/blocks/{block_id}/start", response_model=BlockOut)
def start_block(
    block_id: str,
    req: StartBlockRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Take the disconnection and begin maintenance work on the block."""
    _require_field_role(user)
    block = _get_block(db, block_id)

    if block.status == "IN_PROGRESS":
        raise HTTPException(status_code=409, detail="Block is already in progress")
    if block.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="Block is already completed")

    plan = db.query(BlockPlan).filter(BlockPlan.id == block.plan_id).first()
    if plan and plan.status not in ("APPROVED", "IN_EXECUTION"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot start a block on a {plan.status} plan — the plan must be approved first",
        )

    now = datetime.utcnow()
    block.status = "IN_PROGRESS"
    block.actual_start = now
    block.started_by = user.name
    block.team_leader = req.team_leader or user.name
    block.progress_pct = 0.0
    block.completed_defect_ids = []
    block.pending_defect_ids = list(block.defect_ids or [])

    late_min = (now - block.scheduled_start).total_seconds() / 60
    _log(
        block, "BLOCK_STARTED", user.name,
        f"Disconnection taken on {block.section}. Team leader: {block.team_leader}.",
        late_start_min=round(late_min, 1),
        planned_start=block.scheduled_start.isoformat(),
    )

    if block.defect_ids:
        db.query(Defect).filter(Defect.id.in_(block.defect_ids)).update(
            {"status": "IN_PROGRESS"}, synchronize_session=False
        )

    if plan and plan.status == "APPROVED":
        plan.status = "IN_EXECUTION"

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="BLOCK_STARTED", entity_type="BLOCK", entity_id=block_id,
        details={"section": block.section, "late_start_min": round(late_min, 1)},
    ))
    db.commit()
    db.refresh(block)
    return block


# ── 2. PROGRESS ──────────────────────────────────────────────────────────────

@router.post("/blocks/{block_id}/progress", response_model=BlockOut)
def update_progress(
    block_id: str,
    req: ProgressUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tick off individual defects as the crew finishes them."""
    _require_field_role(user)
    block = _get_block(db, block_id)

    if block.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=409,
            detail=f"Block must be IN_PROGRESS to report progress (currently {block.status})",
        )

    all_ids = set(block.defect_ids or [])
    unknown = set(req.completed_defect_ids) - all_ids
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Defect(s) {sorted(unknown)} are not part of this block",
        )

    completed = [d for d in (block.defect_ids or []) if d in set(req.completed_defect_ids)]
    pending = [d for d in (block.defect_ids or []) if d not in set(completed)]

    block.completed_defect_ids = completed
    block.pending_defect_ids = pending
    block.progress_pct = round(len(completed) / len(all_ids) * 100, 1) if all_ids else 0.0

    _log(
        block, "PROGRESS_REPORTED", user.name,
        f"{len(completed)}/{len(all_ids)} task(s) complete ({block.progress_pct:.0f}%).",
        completed=completed, pending=pending,
        elapsed_hrs=round(_elapsed_hrs(block), 2),
    )

    # Reflect per-defect state so the defect queue stays truthful mid-block.
    if completed:
        db.query(Defect).filter(Defect.id.in_(completed)).update(
            {"status": "COMPLETED"}, synchronize_session=False
        )
    if pending:
        db.query(Defect).filter(Defect.id.in_(pending)).update(
            {"status": "IN_PROGRESS"}, synchronize_session=False
        )

    db.commit()
    db.refresh(block)
    return block


# ── 3. PARTIAL COMPLETE + AI CARRY-FORWARD ───────────────────────────────────

@router.post("/blocks/{block_id}/partial")
def partial_complete(
    block_id: str,
    req: PartialCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hand the line back with work outstanding, and auto-reschedule the rest.

    This is the step that stops backlog from going invisible: every defect left
    unfinished is fed straight back into the window optimiser and lands on a
    concrete follow-up block, or raises an explicit escalation if it cannot.
    """
    _require_field_role(user)
    block = _get_block(db, block_id)

    if block.status not in ("IN_PROGRESS", "PARTIALLY_DONE"):
        raise HTTPException(
            status_code=409,
            detail=f"Block must be IN_PROGRESS to be partially completed (currently {block.status})",
        )

    all_ids = list(block.defect_ids or [])
    completed = [d for d in all_ids if d in set(req.completed_defect_ids)]
    pending = [d for d in all_ids if d not in set(completed)]

    if not pending:
        raise HTTPException(
            status_code=400,
            detail="No outstanding work — use the complete endpoint instead",
        )

    now = datetime.utcnow()
    elapsed = _elapsed_hrs(block, now)

    block.status = "PARTIALLY_DONE"
    block.actual_end = now
    block.actual_duration_hrs = round(elapsed, 2)
    block.completed_defect_ids = completed
    block.pending_defect_ids = pending
    block.progress_pct = round(len(completed) / len(all_ids) * 100, 1) if all_ids else 0.0
    block.partial_reason = req.reason
    block.overrun_min = round(max(0.0, (elapsed - block.duration_hrs) * 60), 1)

    if completed:
        db.query(Defect).filter(Defect.id.in_(completed)).update(
            {"status": "COMPLETED"}, synchronize_session=False
        )

    _log(
        block, "PARTIALLY_DONE", user.name,
        f"Line handed back with {len(pending)} of {len(all_ids)} task(s) outstanding. Reason: {req.reason}",
        completed=completed, pending=pending,
        actual_duration_hrs=block.actual_duration_hrs,
        overrun_min=block.overrun_min,
    )

    # ── Re-optimise the outstanding work into the next-best window ──────────
    pending_defects = db.query(Defect).filter(Defect.id.in_(pending)).all()
    generation = block.carry_forward_generation or 0

    horizon_end = now + timedelta(days=14)
    windows = (
        db.query(BlockWindow)
        .filter(
            BlockWindow.section == block.section,
            BlockWindow.status == "AVAILABLE",
            BlockWindow.window_start >= now,
            BlockWindow.window_start <= horizon_end,
        )
        .all()
    )

    spec = reschedule_carry_forward(
        pending_defects=pending_defects,
        windows=windows,
        section=block.section,
        earliest_start=now,
        generation=generation,
    )

    if spec is None:
        # No feasible window (or the carry-forward chain is exhausted).
        # Surface it loudly rather than dropping the work on the floor.
        reason = (
            f"carry-forward limit of {MAX_CARRY_FORWARD_GENERATION} generations reached"
            if generation >= MAX_CARRY_FORWARD_GENERATION
            else "no feasible traffic window within the 14-day horizon"
        )
        db.query(Defect).filter(Defect.id.in_(pending)).update(
            {"status": "DEFERRED"}, synchronize_session=False
        )
        _log(
            block, "CARRY_FORWARD_ESCALATED", "AI Engine",
            f"Could not auto-reschedule {len(pending)} task(s): {reason}. "
            f"Escalated to the Divisional Block Planner.",
            pending=pending,
        )
        db.add(AuditLog(
            user_id=user.id, user_name=user.name,
            action="CARRY_FORWARD_ESCALATED", entity_type="BLOCK", entity_id=block_id,
            details={"pending": pending, "reason": reason},
        ))
        db.commit()
        db.refresh(block)
        return {
            "block": BlockOut.model_validate(block),
            "carry_forward": None,
            "escalation": {
                "reason": reason,
                "pending_defect_ids": pending,
                "message": (
                    f"{len(pending)} task(s) could not be auto-rescheduled and were "
                    f"deferred for manual planning."
                ),
            },
        }

    # Persist the follow-up block onto the same plan so it appears in the Gantt.
    follow_up = Block(
        id=spec["id"],
        plan_id=block.plan_id,
        section=spec["section"],
        department=spec["department"],
        block_type=spec["block_type"],
        defect_ids=spec["defect_ids"],
        scheduled_start=spec["scheduled_start"],
        scheduled_end=spec["scheduled_end"],
        duration_hrs=spec["duration_hrs"],
        is_combined=spec["is_combined"],
        combined_departments=spec["combined_departments"],
        ai_confidence=spec["ai_confidence"],
        ai_rationale=spec["ai_rationale"],
        status="SCHEDULED",
        progress_pct=0.0,
        completed_defect_ids=[],
        pending_defect_ids=list(spec["defect_ids"]),
        carried_forward_from=block.id,
        carry_forward_generation=generation + 1,
        execution_log=[{
            "event": "CARRY_FORWARD_CREATED",
            "actor": "AI Engine (CP-SAT window optimiser)",
            "detail": spec["ai_rationale"],
            "at": now.isoformat(),
            "parent_block": block.id,
            "alternatives_considered": spec["alternatives_considered"],
        }],
    )
    db.add(follow_up)

    block.carried_forward_to = follow_up.id
    _log(
        block, "CARRY_FORWARD_SCHEDULED", "AI Engine",
        f"{len(pending)} outstanding task(s) auto-rescheduled to {follow_up.id} on "
        f"{spec['scheduled_start']:%d %b %H:%M} "
        f"(evaluated {spec['alternatives_considered']} candidate windows).",
        follow_up_block=follow_up.id,
        window_score=spec["window_score"],
    )

    db.query(Defect).filter(Defect.id.in_(pending)).update(
        {"status": "SCHEDULED"}, synchronize_session=False
    )

    # Reserve the chosen window so the next solve cannot double-book it.
    db.query(BlockWindow).filter(BlockWindow.id == spec["window_id"]).update(
        {"status": "RESERVED"}, synchronize_session=False
    )

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="BLOCK_PARTIALLY_DONE", entity_type="BLOCK", entity_id=block_id,
        details={
            "completed": len(completed), "pending": len(pending),
            "reason": req.reason, "carry_forward_block": follow_up.id,
            "overrun_min": block.overrun_min,
        },
    ))
    db.commit()
    db.refresh(block)
    db.refresh(follow_up)

    return {
        "block": BlockOut.model_validate(block),
        "carry_forward": BlockOut.model_validate(follow_up),
        "escalation": None,
    }


# ── 4. COMPLETE ──────────────────────────────────────────────────────────────

@router.post("/blocks/{block_id}/complete", response_model=BlockOut)
def complete_block(
    block_id: str,
    req: CompleteBlockRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hand the line back with all work finished and the block cleared."""
    _require_field_role(user)
    block = _get_block(db, block_id)

    if block.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="Block is already completed")
    if block.status not in ("IN_PROGRESS", "PARTIALLY_DONE"):
        raise HTTPException(
            status_code=409,
            detail=f"Block must be started before it can be completed (currently {block.status})",
        )

    now = datetime.utcnow()
    elapsed = _elapsed_hrs(block, now)

    block.status = "COMPLETED"
    block.actual_end = now
    block.actual_duration_hrs = round(elapsed, 2)
    block.completed_defect_ids = list(block.defect_ids or [])
    block.pending_defect_ids = []
    block.progress_pct = 100.0
    block.completed_by = user.name
    block.overrun_min = round(max(0.0, (elapsed - block.duration_hrs) * 60), 1)

    if block.defect_ids:
        db.query(Defect).filter(Defect.id.in_(block.defect_ids)).update(
            {"status": "COMPLETED"}, synchronize_session=False
        )

    variance = elapsed - block.duration_hrs
    _log(
        block, "BLOCK_COMPLETED", user.name,
        f"Line cleared on {block.section}. All {len(block.defect_ids or [])} task(s) complete "
        f"in {elapsed:.2f}h against a {block.duration_hrs}h plan "
        f"({'+' if variance >= 0 else ''}{variance * 60:.0f} min).",
        actual_duration_hrs=block.actual_duration_hrs,
        overrun_min=block.overrun_min,
        remarks=req.remarks,
    )

    # Close the plan out once every block on it has reached a terminal state.
    plan = db.query(BlockPlan).filter(BlockPlan.id == block.plan_id).first()
    if plan:
        siblings = db.query(Block).filter(Block.plan_id == plan.id).all()
        if all(b.status in ("COMPLETED", "PARTIALLY_DONE") for b in siblings):
            plan.status = "COMPLETED"

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="BLOCK_COMPLETED", entity_type="BLOCK", entity_id=block_id,
        details={
            "actual_duration_hrs": block.actual_duration_hrs,
            "overrun_min": block.overrun_min,
            "remarks": req.remarks,
        },
    ))
    db.commit()
    db.refresh(block)
    return block


# ── 5. LIVE CONTROL ROOM FEED ────────────────────────────────────────────────

@router.get("/live", response_model=LiveExecutionOut)
def live_execution(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Everything the control room needs on one screen, in one round trip."""
    now = datetime.utcnow()

    active = db.query(Block).filter(Block.status == "IN_PROGRESS").all()
    partial = (
        db.query(Block)
        .filter(Block.status == "PARTIALLY_DONE")
        .order_by(Block.actual_end.desc())
        .limit(20)
        .all()
    )

    upcoming = (
        db.query(Block)
        .filter(
            Block.status == "SCHEDULED",
            Block.scheduled_start >= now - timedelta(hours=6),
            Block.scheduled_start <= now + timedelta(days=3),
        )
        .order_by(Block.scheduled_start.asc())
        .limit(25)
        .all()
    )

    recent = (
        db.query(Block)
        .filter(Block.status == "COMPLETED")
        .order_by(Block.actual_end.desc())
        .limit(10)
        .all()
    )

    # Overrun risk: a live block is at risk once elapsed time approaches the plan.
    at_risk = []
    for b in active:
        elapsed = _elapsed_hrs(b, now)
        planned = b.duration_hrs or 1.0
        ratio = elapsed / planned if planned else 0.0
        done = len(b.completed_defect_ids or [])
        total = len(b.defect_ids or []) or 1

        # Risk compares time burnt against work delivered.
        work_ratio = done / total
        if ratio >= 1.0:
            severity = "OVERRUN"
        elif ratio >= 0.8 and work_ratio < 0.75:
            severity = "HIGH"
        elif ratio >= 0.6 and work_ratio < 0.5:
            severity = "MEDIUM"
        else:
            continue

        at_risk.append({
            "block_id": b.id,
            "section": b.section,
            "severity": severity,
            "elapsed_hrs": round(elapsed, 2),
            "planned_hrs": planned,
            "progress_pct": b.progress_pct or 0.0,
            "overrun_min": round(max(0.0, (elapsed - planned) * 60), 1),
            "message": (
                f"{ratio:.0%} of the planned window consumed with "
                f"{work_ratio:.0%} of tasks complete on {b.section}."
            ),
        })

    severity_rank = {"OVERRUN": 0, "HIGH": 1, "MEDIUM": 2}
    at_risk.sort(key=lambda r: severity_rank.get(r["severity"], 3))

    # Carry-forward chains give the "nothing falls through" narrative.
    carried = db.query(Block).filter(Block.carried_forward_from.isnot(None)).all()
    carried.sort(key=lambda b: b.scheduled_start)
    # Plain dicts bypass the UTCModel stamping, so tag the timestamp here.
    carry_chains = [{
        "block_id": b.id,
        "parent_block_id": b.carried_forward_from,
        "section": b.section,
        "generation": b.carry_forward_generation or 0,
        "defect_count": len(b.defect_ids or []),
        "scheduled_start": b.scheduled_start.replace(tzinfo=timezone.utc).isoformat(),
        "status": b.status,
        "ai_rationale": b.ai_rationale,
    } for b in carried]

    completed_all = db.query(Block).filter(Block.status == "COMPLETED").all()
    durations = [b.actual_duration_hrs for b in completed_all if b.actual_duration_hrs]
    on_time = [b for b in completed_all if (b.overrun_min or 0) <= 0]

    stats = {
        "active_count": len(active),
        "partial_count": len(partial),
        "upcoming_count": len(upcoming),
        "completed_count": len(completed_all),
        "at_risk_count": len(at_risk),
        "carry_forward_count": len(carry_chains),
        "carry_forward_defects": sum(len(b.defect_ids or []) for b in carried),
        "on_time_rate": round(len(on_time) / len(completed_all) * 100, 1) if completed_all else 0.0,
        "avg_actual_hrs": round(sum(durations) / len(durations), 2) if durations else 0.0,
        "total_overrun_min": round(sum(b.overrun_min or 0 for b in completed_all), 1),
    }

    # Resolve the task details for every block in this payload, so the field
    # checklist works on combined cross-department blocks.
    referenced_ids = set()
    for group in (active, partial, upcoming, recent):
        for b in group:
            referenced_ids.update(b.defect_ids or [])

    tasks = {}
    if referenced_ids:
        for d in db.query(Defect).filter(Defect.id.in_(referenced_ids)).all():
            tasks[d.id] = d

    return {
        "server_time": now,
        "active_blocks": active,
        "partial_blocks": partial,
        "upcoming_blocks": upcoming,
        "recent_completions": recent,
        "at_risk": at_risk,
        "carry_forward_chains": carry_chains,
        "stats": stats,
        "tasks": tasks,
    }


# ── 6. DEMO RESET ────────────────────────────────────────────────────────────

@router.post("/demo/reset")
def reset_demo(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the corridor to a clean, demo-ready state.

    Judges click through the same flow repeatedly; without this the defect pool
    drains and every subsequent plan comes back empty.
    """
    if user.role not in ("SUPER_ADMIN", "ZONAL_ADMIN", "DIVISIONAL_BLOCK_PLANNER"):
        raise HTTPException(status_code=403, detail="Only planners and admins can reset the demo")

    now = datetime.utcnow()

    # Drop AI-generated carry-forward blocks, then every non-seed plan.
    cf_deleted = db.query(Block).filter(Block.carried_forward_from.isnot(None)).delete(
        synchronize_session=False
    )

    # Release reserved windows and re-open the ones now in the past.
    db.query(BlockWindow).filter(BlockWindow.status == "RESERVED").update(
        {"status": "AVAILABLE"}, synchronize_session=False
    )

    # Re-open defects so the optimiser has a full pool to work with again.
    reopened = db.query(Defect).filter(
        Defect.status.in_(["SCHEDULED", "IN_PROGRESS", "DEFERRED"])
    ).update({"status": "OPEN"}, synchronize_session=False)

    # Reset every block that is not part of the historical seed narrative.
    blocks_reset = db.query(Block).filter(
        Block.status.in_(["IN_PROGRESS", "PARTIALLY_DONE", "OVERRIDDEN"])
    ).update({
        "status": "SCHEDULED",
        "actual_start": None,
        "actual_end": None,
        "actual_duration_hrs": None,
        "progress_pct": 0.0,
        "completed_defect_ids": [],
        "pending_defect_ids": [],
        "partial_reason": None,
        "overrun_min": 0.0,
        "execution_log": [],
        "carried_forward_to": None,
    }, synchronize_session=False)

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="DEMO_RESET", entity_type="SYSTEM", entity_id=None,
        details={
            "defects_reopened": reopened,
            "blocks_reset": blocks_reset,
            "carry_forward_blocks_removed": cf_deleted,
        },
    ))
    db.commit()

    return {
        "status": "ok",
        "reset_at": now.isoformat(),
        "defects_reopened": reopened,
        "blocks_reset": blocks_reset,
        "carry_forward_blocks_removed": cf_deleted,
        "message": "Corridor reset — defect pool re-opened and execution state cleared.",
    }
