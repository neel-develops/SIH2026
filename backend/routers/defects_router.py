from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Defect, AuditLog, User
from auth import get_current_user
from schemas import DefectOut, DefectCreate
from services.ai_engine import score_defect

router = APIRouter(prefix="/api/v1/defects", tags=["defects"])


def apply_scope(query, user: User):
    if user.role == "SUPER_ADMIN":
        return query
    if user.role in ("SSE_ENGINEERING", "SSE_SIGNAL_TELECOM", "SSE_TRACTION_DISTRIBUTION"):
        dept_map = {
            "SSE_ENGINEERING": "ENG",
            "SSE_SIGNAL_TELECOM": "S&T",
            "SSE_TRACTION_DISTRIBUTION": "TD",
        }
        query = query.filter(Defect.department == dept_map.get(user.role, ""))
        if user.assigned_sections:
            query = query.filter(Defect.section.in_(user.assigned_sections))
        return query
    if user.role == "JUNIOR_ENGINEER":
        if user.assigned_sections:
            query = query.filter(Defect.section.in_(user.assigned_sections))
        if user.department:
            query = query.filter(Defect.department == user.department)
        return query
    return query


@router.get("/", response_model=list[DefectOut])
def list_defects(
    department: Optional[str] = Query(None),
    criticality: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Defect)
    q = apply_scope(q, user)

    if department:
        q = q.filter(Defect.department == department)
    if criticality:
        q = q.filter(Defect.criticality == criticality)
    if status:
        q = q.filter(Defect.status == status)
    if section:
        q = q.filter(Defect.section == section)
    if search:
        q = q.filter(
            Defect.defect_type.ilike(f"%{search}%")
            | Defect.description.ilike(f"%{search}%")
            | Defect.id.ilike(f"%{search}%")
        )

    total = q.count()
    defects = q.order_by(Defect.priority_score.desc()).offset(skip).limit(limit).all()
    return defects


@router.get("/stats")
def defect_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Defect)
    q = apply_scope(q, user)

    total = q.count()
    open_count = q.filter(Defect.status == "OPEN").count()
    in_progress = q.filter(Defect.status == "IN_PROGRESS").count()
    scheduled = q.filter(Defect.status == "SCHEDULED").count()
    completed = q.filter(Defect.status == "COMPLETED").count()
    overdue = q.filter(Defect.due_date < datetime.utcnow(), Defect.status.in_(["OPEN", "IN_PROGRESS"])).count()

    critical = q.filter(Defect.criticality == "CRITICAL").count()
    high = q.filter(Defect.criticality == "HIGH").count()

    dept_counts = {}
    for dept in ["ENG", "S&T", "TD"]:
        dept_counts[dept] = q.filter(Defect.department == dept).count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "scheduled": scheduled,
        "completed": completed,
        "overdue": overdue,
        "critical": critical,
        "high": high,
        "by_department": dept_counts,
    }


@router.get("/{defect_id}", response_model=DefectOut)
def get_defect(
    defect_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect


@router.post("/", response_model=DefectOut)
def create_defect(
    req: DefectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    due_days = {"CRITICAL": 3, "HIGH": 7, "MEDIUM": 21, "LOW": 45}

    defect = Defect(
        id=f"DEF-{req.department[:3]}-{db.query(Defect).count() + 1:04d}",
        source_system="FIELD_REPORT",
        section=req.section,
        km_from=req.km_from,
        km_to=req.km_to,
        defect_type=req.defect_type,
        asset_type=req.asset_type,
        description=req.description,
        reported_date=now,
        due_date=now + __import__("datetime").timedelta(days=due_days.get(req.criticality, 14)),
        criticality=req.criticality,
        status="OPEN",
        department=req.department,
        reported_by=user.name,
        requires_tsr=req.requires_tsr,
        estimated_duration_hrs=req.estimated_duration_hrs,
        failure_frequency=1,
        traffic_density=0.5,
    )

    score, factors = score_defect(defect)
    defect.priority_score = score
    defect.ai_factors = factors

    db.add(defect)
    db.add(AuditLog(
        user_id=user.id, user_name=user.name,
        action="CREATE", entity_type="DEFECT", entity_id=defect.id,
        details={"section": req.section, "criticality": req.criticality},
    ))
    db.commit()
    db.refresh(defect)
    return defect
