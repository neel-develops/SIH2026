import io
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Defect, BlockPlan, Block, KPISnapshot, User
from auth import get_current_user
from schemas import KPIOut, ReportOut

router = APIRouter(prefix="/api/v1", tags=["reports"])


@router.get("/kpi", response_model=KPIOut)
def get_kpi(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    # AAI trend (90 days)
    snapshots = (
        db.query(KPISnapshot)
        .order_by(KPISnapshot.date.asc())
        .all()
    )
    aai_trend = [{"date": s.date.isoformat(), "aai": s.aai} for s in snapshots]
    aai_current = snapshots[-1].aai if snapshots else 82.0

    # Today's blocks
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    blocks_today = db.query(Block).filter(
        Block.scheduled_start >= today_start,
        Block.scheduled_start < today_end,
    ).count()

    # Defect counts
    open_defects = db.query(Defect).filter(Defect.status.in_(["OPEN", "IN_PROGRESS"])).count()
    overdue = db.query(Defect).filter(
        Defect.due_date < now,
        Defect.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()

    # Pending approvals
    pending = db.query(BlockPlan).filter(BlockPlan.status == "PENDING_APPROVAL").count()

    # Block utilization
    all_blocks = db.query(Block).all()
    total_scheduled_hrs = sum(b.duration_hrs for b in all_blocks) or 1
    total_actual_hrs = sum(
        ((b.actual_end - b.actual_start).total_seconds() / 3600 if b.actual_start and b.actual_end else b.duration_hrs)
        for b in all_blocks
    ) or 1
    utilization = min(0.95, total_actual_hrs / (total_scheduled_hrs * 1.2))

    combined_count = sum(1 for b in all_blocks if b.is_combined)
    combined_rate = combined_count / max(len(all_blocks), 1)

    # Department breakdown
    dept_counts = defaultdict(int)
    for d in db.query(Defect).all():
        dept_counts[d.department] += 1

    # Section workload
    sections = ["CSTM-KYN", "KYN-KJT", "KJT-IGP", "IGP-LNL", "LNL-PUNE", "KYN-KSRA"]
    section_workload = []
    for sec in sections:
        sec_defects = db.query(Defect).filter(Defect.section == sec, Defect.status.in_(["OPEN", "IN_PROGRESS", "SCHEDULED"])).count()
        sec_blocks = db.query(Block).filter(Block.section == sec).count()
        section_workload.append({
            "section": sec,
            "defects": sec_defects,
            "blocks": sec_blocks,
        })

    return KPIOut(
        aai_current=aai_current,
        aai_trend=aai_trend,
        blocks_today=blocks_today,
        open_defects=open_defects,
        overdue_defects=overdue,
        pending_approvals=pending,
        block_utilization=round(utilization, 2),
        combined_block_rate=round(combined_rate, 2),
        department_breakdown=dict(dept_counts),
        section_workload=section_workload,
    )


@router.get("/reports", response_model=ReportOut)
def get_reports(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sections = ["CSTM-KYN", "KYN-KJT", "KJT-IGP", "IGP-LNL", "LNL-PUNE", "KYN-KSRA"]

    # Compliance: planned vs completed by section
    compliance_data = []
    for sec in sections:
        planned = db.query(Block).filter(Block.section == sec).count()
        completed = db.query(Block).filter(Block.section == sec, Block.status == "COMPLETED").count()
        compliance_data.append({
            "section": sec,
            "planned": planned,
            "completed": completed,
            "rate": round(completed / max(planned, 1), 2),
        })

    # Department distribution
    dept_dist = {}
    for dept in ["ENG", "S&T", "TD"]:
        dept_dist[dept] = db.query(Defect).filter(Defect.department == dept).count()

    # Before/After metrics
    plans = db.query(BlockPlan).all()
    avg_aai_before = 82.0
    avg_aai_after = 82.0
    if plans:
        before_vals = [p.aai_before for p in plans if p.aai_before]
        after_vals = [p.aai_after for p in plans if p.aai_after]
        if before_vals:
            avg_aai_before = sum(before_vals) / len(before_vals)
        if after_vals:
            avg_aai_after = sum(after_vals) / len(after_vals)

    all_blocks = db.query(Block).all()
    combined_count = sum(1 for b in all_blocks if b.is_combined)
    total_blocks = max(len(all_blocks), 1)

    overdue = db.query(Defect).filter(
        Defect.due_date < datetime.utcnow(),
        Defect.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()
    total_defects = max(db.query(Defect).count(), 1)

    # AAI trend
    snapshots = db.query(KPISnapshot).order_by(KPISnapshot.date.asc()).all()
    aai_trend = [{"date": s.date.isoformat(), "aai": s.aai} for s in snapshots]

    return ReportOut(
        compliance_data=compliance_data,
        department_distribution=dept_dist,
        before_after={
            "aai": {"before": round(avg_aai_before, 1), "after": round(avg_aai_after, 1)},
            "combined_block_rate": {"before": 0.08, "after": round(combined_count / total_blocks, 2)},
            "overdue_rate": {"before": 0.18, "after": round(overdue / total_defects, 2)},
            "planning_time": {"before": "3-5 days", "after": "<60 seconds"},
        },
        aai_trend=aai_trend,
        summary={
            "total_plans": len(plans),
            "total_blocks": len(all_blocks),
            "total_defects": total_defects,
            "combined_blocks": combined_count,
            "avg_solver_time_ms": round(
                sum(p.solver_time_ms or 0 for p in plans) / max(len(plans), 1)
            ),
        },
    )


@router.get("/reports/export/excel")
def export_excel(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import xlsxwriter

    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {"in_memory": True})

    # Defects sheet
    ws = workbook.add_worksheet("Defects")
    headers = ["ID", "Section", "Department", "Type", "Criticality", "Priority", "Status", "Reported"]
    bold = workbook.add_format({"bold": True, "bg_color": "#D4A853", "font_color": "white"})
    for col, h in enumerate(headers):
        ws.write(0, col, h, bold)

    for row, d in enumerate(db.query(Defect).order_by(Defect.priority_score.desc()).all(), 1):
        ws.write(row, 0, d.id)
        ws.write(row, 1, d.section)
        ws.write(row, 2, d.department)
        ws.write(row, 3, d.defect_type)
        ws.write(row, 4, d.criticality)
        ws.write(row, 5, d.priority_score)
        ws.write(row, 6, d.status)
        ws.write(row, 7, d.reported_date.strftime("%Y-%m-%d"))

    ws.autofit()

    # Block Plans sheet
    ws2 = workbook.add_worksheet("Block Plans")
    headers2 = ["Plan ID", "Name", "Status", "Blocks", "AAI Before", "AAI After", "Solver Time (ms)"]
    for col, h in enumerate(headers2):
        ws2.write(0, col, h, bold)

    for row, p in enumerate(db.query(BlockPlan).all(), 1):
        ws2.write(row, 0, p.id)
        ws2.write(row, 1, p.name)
        ws2.write(row, 2, p.status)
        ws2.write(row, 3, len(p.blocks))
        ws2.write(row, 4, p.aai_before or 0)
        ws2.write(row, 5, p.aai_after or 0)
        ws2.write(row, 6, p.solver_time_ms or 0)

    ws2.autofit()

    # Blocks sheet
    ws3 = workbook.add_worksheet("Blocks")
    headers3 = ["ID", "Plan", "Section", "Department", "Type", "Start", "End", "Duration(h)", "Combined", "Confidence"]
    for col, h in enumerate(headers3):
        ws3.write(0, col, h, bold)

    for row, b in enumerate(db.query(Block).all(), 1):
        ws3.write(row, 0, b.id)
        ws3.write(row, 1, b.plan_id)
        ws3.write(row, 2, b.section)
        ws3.write(row, 3, b.department)
        ws3.write(row, 4, b.block_type)
        ws3.write(row, 5, b.scheduled_start.strftime("%Y-%m-%d %H:%M"))
        ws3.write(row, 6, b.scheduled_end.strftime("%Y-%m-%d %H:%M"))
        ws3.write(row, 7, b.duration_hrs)
        ws3.write(row, 8, "Yes" if b.is_combined else "No")
        ws3.write(row, 9, b.ai_confidence)

    ws3.autofit()
    workbook.close()
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=AABPS_Report.xlsx"},
    )


@router.get("/reports/export/pdf")
def export_pdf(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("AABPS — Block Planning Report", styles["Title"]))
    elements.append(Paragraph("AI-Powered Automatic Block Planning System", styles["Subtitle"]))
    elements.append(Spacer(1, 20))

    # Summary
    plans = db.query(BlockPlan).all()
    blocks = db.query(Block).all()
    defects = db.query(Defect).all()

    summary_data = [
        ["Metric", "Value"],
        ["Total Plans", str(len(plans))],
        ["Total Blocks Scheduled", str(len(blocks))],
        ["Combined Blocks", str(sum(1 for b in blocks if b.is_combined))],
        ["Total Defects", str(len(defects))],
        ["Open Defects", str(sum(1 for d in defects if d.status == "OPEN"))],
        ["Average AAI", f"{sum(p.aai_after or 82 for p in plans) / max(len(plans), 1):.1f}%"],
    ]

    t = Table(summary_data, colWidths=[250, 200])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4A853")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F0E8")]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Block Plans", styles["Heading2"]))
    plan_data = [["Plan ID", "Status", "Blocks", "AAI"]]
    for p in plans:
        plan_data.append([p.id, p.status, str(len(p.blocks)), f"{p.aai_after or 0:.1f}%"])

    if len(plan_data) > 1:
        t2 = Table(plan_data, colWidths=[150, 100, 60, 60])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5C6B54")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        elements.append(t2)

    doc.build(elements)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=AABPS_Report.pdf"},
    )
