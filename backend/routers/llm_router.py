from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import User, Defect, BlockPlan, KPISnapshot
from schemas import DefectOut
from services.ai_engine import score_defect
from services.llm_service import (
    extract_defect_from_text,
    generate_block_rationale,
    generate_executive_summary,
    chat_assistant,
    analyze_defect_trends,
)

import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/ai", tags=["AI / LLM"])


class SmartDefectRequest(BaseModel):
    text: str
    lang: str = "auto"


class ChatRequest(BaseModel):
    message: str


class RationaleRequest(BaseModel):
    block_id: str
    plan_id: str


# ── Smart Defect Creation (NL → Structured) ────────────────────────────────

@router.post("/smart-defect", response_model=DefectOut)
async def smart_create_defect(
    req: SmartDefectRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Extract defect from natural language (Hindi/English) and create it."""
    try:
        extracted = await extract_defect_from_text(req.text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"AI extraction failed: {str(e)}")

    dept = extracted.get("department", "ENG")
    count = db.query(Defect).filter(Defect.department == dept).count()
    defect_id = f"DEF-{dept}-{count + 1:04d}"

    crit = extracted.get("criticality", "MEDIUM")
    due_days = {"CRITICAL": 3, "HIGH": 7, "MEDIUM": 21, "LOW": 45}.get(crit, 21)

    source_map = {"ENG": "TMS", "S&T": "SMMS", "TD": "TDMS"}

    defect = Defect(
        id=defect_id,
        source_system=source_map.get(dept, "FIELD_REPORT"),
        section=extracted.get("section", "CSTM-KYN"),
        km_from=extracted.get("km_from", 0),
        defect_type=extracted.get("defect_type", "Unknown"),
        asset_type=extracted.get("asset_type"),
        description=extracted.get("description", req.text),
        reported_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=due_days),
        criticality=crit,
        status="OPEN",
        department=dept,
        reported_by=user.name,
        requires_tsr=extracted.get("requires_tsr", False),
        estimated_duration_hrs=extracted.get("estimated_duration_hrs", 2.0),
        traffic_density=0.6,
        failure_frequency=1,
    )

    score, factors = score_defect(defect)
    defect.priority_score = score
    defect.ai_factors = factors

    db.add(defect)
    db.commit()
    db.refresh(defect)
    return defect


# ── Chat Assistant ──────────────────────────────────────────────────────────

@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Conversational AI assistant with live system context."""
    latest_kpi = db.query(KPISnapshot).order_by(KPISnapshot.date.desc()).first()
    open_count = db.query(Defect).filter(Defect.status.in_(["OPEN", "IN_PROGRESS"])).count()
    overdue_count = db.query(Defect).filter(
        Defect.due_date < datetime.utcnow(),
        Defect.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()
    pending_count = db.query(BlockPlan).filter(BlockPlan.status == "PENDING_APPROVAL").count()
    blocks_today = 0

    dept_counts = {}
    for dept in ["ENG", "S&T", "TD"]:
        dept_counts[dept] = db.query(Defect).filter(
            Defect.department == dept,
            Defect.status.in_(["OPEN", "IN_PROGRESS"]),
        ).count()

    context = {
        "aai_current": latest_kpi.aai if latest_kpi else 0,
        "open_defects": open_count,
        "overdue_defects": overdue_count,
        "blocks_today": blocks_today,
        "pending_approvals": pending_count,
        "department_breakdown": dept_counts,
        "section_workload": [],
        "user_name": user.name,
        "user_role": user.role,
    }

    try:
        reply = await chat_assistant(req.message, context)
        return {"reply": reply, "context_used": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")


# ── Executive Summary ───────────────────────────────────────────────────────

@router.get("/executive-summary")
async def get_executive_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate AI executive summary for DRM briefing."""
    latest_kpi = db.query(KPISnapshot).order_by(KPISnapshot.date.desc()).first()
    open_count = db.query(Defect).filter(Defect.status.in_(["OPEN", "IN_PROGRESS"])).count()
    overdue_count = db.query(Defect).filter(
        Defect.due_date < datetime.utcnow(),
        Defect.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()
    pending_count = db.query(BlockPlan).filter(BlockPlan.status == "PENDING_APPROVAL").count()

    dept_counts = {}
    for dept in ["ENG", "S&T", "TD"]:
        dept_counts[dept] = db.query(Defect).filter(
            Defect.department == dept,
            Defect.status.in_(["OPEN", "IN_PROGRESS"]),
        ).count()

    kpi_data = {
        "aai_current": latest_kpi.aai if latest_kpi else 0,
        "open_defects": open_count,
        "overdue_defects": overdue_count,
        "blocks_today": 0,
        "pending_approvals": pending_count,
        "block_utilization": latest_kpi.avg_utilization if latest_kpi else 0,
        "combined_block_rate": latest_kpi.combined_block_rate if latest_kpi else 0,
        "department_breakdown": dept_counts,
    }

    latest_plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
    plan_data = None
    if latest_plan:
        plan_data = {
            "tasks_scheduled": latest_plan.tasks_scheduled,
            "combined_blocks": latest_plan.combined_blocks,
            "solver_time_ms": latest_plan.solver_time_ms,
            "aai_before": latest_plan.aai_before,
            "aai_after": latest_plan.aai_after,
            "conflicts_resolved": latest_plan.conflicts_resolved,
        }

    try:
        summary = await generate_executive_summary(kpi_data, plan_data)
        return {"summary": summary, "generated_at": datetime.utcnow().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI summary error: {str(e)}")


# ── Block Rationale ─────────────────────────────────────────────────────────

@router.post("/block-rationale")
async def get_block_rationale(
    req: RationaleRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate AI rationale for a specific block."""
    from models import Block
    block = db.query(Block).filter(Block.id == req.block_id, Block.plan_id == req.plan_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    defect_types = []
    if block.defect_ids:
        defects = db.query(Defect).filter(Defect.id.in_(block.defect_ids)).all()
        defect_types = list(set(d.defect_type for d in defects))

    block_info = {
        "section": block.section,
        "department": block.department,
        "duration_hrs": block.duration_hrs,
        "is_combined": block.is_combined,
        "combined_departments": block.combined_departments or [],
        "defect_count": len(block.defect_ids) if block.defect_ids else 0,
        "defect_types": defect_types,
        "ai_confidence": block.ai_confidence,
        "scheduled_start": str(block.scheduled_start),
        "scheduled_end": str(block.scheduled_end),
    }

    try:
        rationale = await generate_block_rationale(block_info)
        block.ai_rationale = rationale
        db.commit()
        return {"rationale": rationale, "block_id": block.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI rationale error: {str(e)}")


# ── Defect Trend Analysis ──────────────────────────────────────────────────

@router.get("/defect-insights")
async def get_defect_insights(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """AI-powered defect trend analysis and recommendations."""
    sections = ["CSTM-KYN", "KYN-KJT", "KJT-IGP", "IGP-LNL", "LNL-PUNE", "KYN-KSRA"]
    stats = {"total_open": 0, "total_overdue": 0, "by_section": {}, "by_department": {}, "by_criticality": {}}

    for sec in sections:
        count = db.query(Defect).filter(
            Defect.section == sec,
            Defect.status.in_(["OPEN", "IN_PROGRESS"]),
        ).count()
        stats["by_section"][sec] = count

    for dept in ["ENG", "S&T", "TD"]:
        count = db.query(Defect).filter(
            Defect.department == dept,
            Defect.status.in_(["OPEN", "IN_PROGRESS"]),
        ).count()
        stats["by_department"][dept] = count

    for crit in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        count = db.query(Defect).filter(
            Defect.criticality == crit,
            Defect.status.in_(["OPEN", "IN_PROGRESS"]),
        ).count()
        stats["by_criticality"][crit] = count

    stats["total_open"] = sum(stats["by_department"].values())
    stats["total_overdue"] = db.query(Defect).filter(
        Defect.due_date < datetime.utcnow(),
        Defect.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()

    try:
        insights = await analyze_defect_trends(stats)
        return {"insights": insights, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(e)}")
