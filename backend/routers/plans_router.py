import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Defect, BlockWindow, BlockPlan, Block, PlanApproval, AuditLog, User
from auth import get_current_user, require_roles
from schemas import (
    BlockPlanOut, GeneratePlanRequest, ApprovalRequest,
    OverrideRequest, BlockStatusUpdate, BlockOut,
)
from services.ai_engine import solve_block_plan, calculate_aai, score_defect

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


@router.get("/", response_model=list[BlockPlanOut])
def list_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plans = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).all()
    return plans


@router.get("/{plan_id}", response_model=BlockPlanOut)
def get_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/generate", response_model=BlockPlanOut)
def generate_plan(
    req: GeneratePlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run the AI engine to generate an optimized block plan."""
    now = datetime.utcnow()
    horizon_start = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    horizon_end = horizon_start + timedelta(days=req.horizon_days)

    # Candidate pool = everything still outstanding.
    #
    # A defect only leaves the pool when the work is actually done, or when it is
    # already locked into a plan that has been approved for execution. Treating a
    # merely *generated* plan as a commitment drains the pool on every solve and
    # leaves later plans empty.
    committed_defect_ids = set()
    committed_blocks = (
        db.query(Block)
        .join(BlockPlan, Block.plan_id == BlockPlan.id)
        .filter(
            (BlockPlan.status.in_(["APPROVED", "IN_EXECUTION", "COMPLETED"]))
            | (Block.status.in_(["IN_PROGRESS", "PARTIALLY_DONE", "COMPLETED"]))
        )
        .all()
    )
    for blk in committed_blocks:
        # Work already finished inside a block is done; the rest is still owed.
        done = set(blk.completed_defect_ids or [])
        for did in (blk.defect_ids or []):
            if did in done or blk.status == "COMPLETED":
                continue
            committed_defect_ids.add(did)

    query = db.query(Defect).filter(Defect.status != "COMPLETED")
    if committed_defect_ids:
        query = query.filter(~Defect.id.in_(committed_defect_ids))

    defects = query.order_by(Defect.priority_score.desc()).limit(200).all()

    if not defects:
        raise HTTPException(
            status_code=409,
            detail=(
                "No outstanding defects available to schedule — every defect is either "
                "completed or already committed to an approved plan. Use the demo reset "
                "to re-open the corridor."
            ),
        )

    # Re-score defects
    for d in defects:
        score, factors = score_defect(d)
        d.priority_score = score
        d.ai_factors = factors

    # Get available windows in the horizon
    windows = (
        db.query(BlockWindow)
        .filter(
            BlockWindow.status == "AVAILABLE",
            BlockWindow.window_start >= horizon_start,
            BlockWindow.window_start <= horizon_end,
        )
        .all()
    )

    if not windows:
        raise HTTPException(
            status_code=409,
            detail=(
                f"No traffic windows available between {horizon_start:%d %b %Y} and "
                f"{horizon_end:%d %b %Y}. The seeded window calendar may have lapsed — "
                "restart the backend to regenerate it."
            ),
        )

    # Run OR-Tools solver
    result = solve_block_plan(defects, windows, enable_combined=req.enable_combined_blocks)

    # Calculate AAI
    aai = calculate_aai(result["blocks"])

    # Create plan
    plan_id = f"PLAN-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    plan = BlockPlan(
        id=plan_id,
        name=f"{'Weekly' if req.horizon_days == 7 else 'Monthly'} Plan — {req.corridor}",
        plan_type=req.plan_type,
        horizon_start=horizon_start,
        horizon_end=horizon_end,
        division="Mumbai",
        status="PENDING_APPROVAL",
        generated_by="AI Engine v1.0 (OR-Tools CP-SAT)",
        created_at=now,
        solver_time_ms=result["solver_time_ms"],
        objective_score=result["objective_score"],
        tasks_scheduled=result["tasks_scheduled"],
        conflicts_resolved=result["conflicts_resolved"],
        combined_blocks=result["combined_blocks"],
        aai_before=aai["aai_before"],
        aai_after=aai["aai_after"],
    )

    for b_data in result["blocks"]:
        block = Block(
            id=b_data["id"],
            plan_id=plan_id,
            section=b_data["section"],
            department=b_data["department"],
            block_type=b_data["block_type"],
            defect_ids=b_data["defect_ids"],
            scheduled_start=b_data["scheduled_start"],
            scheduled_end=b_data["scheduled_end"],
            duration_hrs=b_data["duration_hrs"],
            is_combined=b_data["is_combined"],
            combined_departments=b_data["combined_departments"],
            ai_confidence=b_data["ai_confidence"],
            ai_rationale=b_data["ai_rationale"],
            status="SCHEDULED",
        )
        plan.blocks.append(block)

    # Deliberately NOT flipping the defects to SCHEDULED here. A generated plan is
    # a proposal, not a commitment — defects are only consumed once the plan is
    # approved (see approve_plan), so a planner can generate and compare several
    # candidate plans against the same defect pool.

    db.add(plan)
    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="GENERATE_PLAN", entity_type="BLOCK_PLAN", entity_id=plan_id,
        details={
            "solver_time_ms": result["solver_time_ms"],
            "tasks_scheduled": result["tasks_scheduled"],
            "combined_blocks": result["combined_blocks"],
        },
    ))
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/{plan_id}/approve")
def approve_plan(
    plan_id: str,
    req: ApprovalRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Clients have historically sent both the verb ("APPROVE") and the past
    # participle ("APPROVED"); normalise so neither silently no-ops.
    action = (req.action or "").strip().upper()
    if action in ("APPROVE", "APPROVED"):
        action = "APPROVED"
    elif action in ("REJECT", "REJECTED"):
        action = "REJECTED"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown approval action '{req.action}' — expected APPROVE or REJECT",
        )

    approval = PlanApproval(
        id=str(uuid.uuid4()),
        plan_id=plan_id,
        user_id=user.id,
        user_name=user.name,
        role=user.role,
        action=action,
        comment=req.comment,
        created_at=datetime.utcnow(),
    )
    db.add(approval)

    if action == "APPROVED":
        if user.role in ("SENIOR_OFFICER", "SUPER_ADMIN"):
            plan.status = "APPROVED"
            plan.approved_by = user.name
            plan.approved_at = datetime.utcnow()
        elif user.role == "DIVISIONAL_BLOCK_PLANNER":
            approvals = db.query(PlanApproval).filter(
                PlanApproval.plan_id == plan_id,
                PlanApproval.action == "APPROVED",
            ).count()
            if approvals >= 1:
                plan.status = "APPROVED"
                plan.approved_by = user.name
                plan.approved_at = datetime.utcnow()
            else:
                plan.status = "PENDING_APPROVAL"
        else:
            plan.status = "PENDING_APPROVAL"
    elif action == "REJECTED":
        plan.status = "REJECTED"

    # Approval is the point of commitment: only now do the defects leave the
    # planning pool, so competing draft plans can be compared before one wins.
    if plan.status == "APPROVED":
        committed = []
        for blk in plan.blocks:
            committed.extend(blk.defect_ids or [])
        if committed:
            db.query(Defect).filter(
                Defect.id.in_(committed),
                Defect.status != "COMPLETED",
            ).update({"status": "SCHEDULED"}, synchronize_session=False)

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action=f"PLAN_{action}", entity_type="BLOCK_PLAN", entity_id=plan_id,
        details={"comment": req.comment},
    ))
    db.commit()

    return {"status": plan.status, "message": f"Plan {action.lower()} by {user.name}"}


@router.post("/{plan_id}/blocks/{block_id}/override", response_model=BlockOut)
def override_block(
    plan_id: str,
    block_id: str,
    req: OverrideRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = db.query(Block).filter(Block.id == block_id, Block.plan_id == plan_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    if req.new_start:
        block.scheduled_start = req.new_start
    if req.new_end:
        block.scheduled_end = req.new_end
    block.override_reason = req.reason
    block.overridden_by = user.name
    block.status = "OVERRIDDEN"

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="OVERRIDE_BLOCK", entity_type="BLOCK", entity_id=block_id,
        details={"reason": req.reason},
    ))
    db.commit()
    db.refresh(block)
    return block


@router.patch("/{plan_id}/blocks/{block_id}/status", response_model=BlockOut)
def update_block_status(
    plan_id: str,
    block_id: str,
    req: BlockStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = db.query(Block).filter(Block.id == block_id, Block.plan_id == plan_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    block.status = req.status
    if req.actual_start:
        block.actual_start = req.actual_start
    if req.actual_end:
        block.actual_end = req.actual_end

    # If block completed, mark defects as completed too
    if req.status == "COMPLETED" and block.defect_ids:
        db.query(Defect).filter(Defect.id.in_(block.defect_ids)).update(
            {"status": "COMPLETED"}, synchronize_session=False
        )

    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action=f"BLOCK_{req.status}", entity_type="BLOCK", entity_id=block_id,
    ))
    db.commit()
    db.refresh(block)
    return block
