import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Boolean, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=True)
    zone = Column(String, default="CR")
    division = Column(String, default="Mumbai")
    assigned_sections = Column(JSON, default=list)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String, primary_key=True, default=gen_uuid)
    source_system = Column(String, nullable=False)
    external_defect_id = Column(String, nullable=True)
    section = Column(String, nullable=False, index=True)
    km_from = Column(Float, nullable=False)
    km_to = Column(Float, nullable=True)
    defect_type = Column(String, nullable=False)
    asset_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    reported_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=True)
    criticality = Column(String, nullable=False)
    priority_score = Column(Float, default=0.0)
    ai_factors = Column(JSON, nullable=True)
    status = Column(String, default="OPEN", index=True)
    department = Column(String, nullable=False, index=True)
    reported_by = Column(String, nullable=True)
    requires_tsr = Column(Boolean, default=False)
    estimated_duration_hrs = Column(Float, default=2.0)
    failure_frequency = Column(Integer, default=1)
    last_failure_date = Column(DateTime, nullable=True)
    traffic_density = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.utcnow)


class BlockWindow(Base):
    __tablename__ = "block_windows"

    id = Column(String, primary_key=True, default=gen_uuid)
    section = Column(String, nullable=False, index=True)
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    available_for = Column(JSON, default=list)
    train_count = Column(Integer, default=0)
    score = Column(Float, default=0.5)
    status = Column(String, default="AVAILABLE")


class BlockPlan(Base):
    __tablename__ = "block_plans"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    plan_type = Column(String, default="WEEKLY")
    horizon_start = Column(DateTime, nullable=False)
    horizon_end = Column(DateTime, nullable=False)
    division = Column(String, default="Mumbai")
    status = Column(String, default="DRAFT", index=True)
    generated_by = Column(String, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI generation metrics
    solver_time_ms = Column(Integer, nullable=True)
    objective_score = Column(Float, nullable=True)
    tasks_scheduled = Column(Integer, nullable=True)
    conflicts_resolved = Column(Integer, nullable=True)
    combined_blocks = Column(Integer, nullable=True)
    aai_before = Column(Float, nullable=True)
    aai_after = Column(Float, nullable=True)

    blocks = relationship("Block", back_populates="plan", cascade="all, delete-orphan")
    approvals = relationship("PlanApproval", back_populates="plan", cascade="all, delete-orphan")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(String, primary_key=True, default=gen_uuid)
    plan_id = Column(String, ForeignKey("block_plans.id"), nullable=False)
    section = Column(String, nullable=False)
    department = Column(String, nullable=False)
    block_type = Column(String, default="TRAFFIC")
    defect_ids = Column(JSON, default=list)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    duration_hrs = Column(Float, nullable=False)
    is_combined = Column(Boolean, default=False)
    combined_departments = Column(JSON, nullable=True)
    ai_confidence = Column(Float, default=0.85)
    ai_rationale = Column(Text, nullable=True)
    # Lifecycle: SCHEDULED → IN_PROGRESS → PARTIALLY_DONE → COMPLETED
    status = Column(String, default="SCHEDULED")
    override_reason = Column(Text, nullable=True)
    overridden_by = Column(String, nullable=True)
    team_leader = Column(String, nullable=True)
    resources_required = Column(JSON, nullable=True)

    # ── Execution tracking ──────────────────────────────────────────────
    progress_pct = Column(Float, default=0.0)
    completed_defect_ids = Column(JSON, default=list)
    pending_defect_ids = Column(JSON, default=list)
    partial_reason = Column(Text, nullable=True)
    execution_log = Column(JSON, default=list)
    actual_duration_hrs = Column(Float, nullable=True)
    overrun_min = Column(Float, default=0.0)
    started_by = Column(String, nullable=True)
    completed_by = Column(String, nullable=True)

    # ── AI carry-forward chain ──────────────────────────────────────────
    carried_forward_from = Column(String, nullable=True)   # parent block id
    carried_forward_to = Column(String, nullable=True)     # child block id
    carry_forward_generation = Column(Integer, default=0)  # 0 = original

    plan = relationship("BlockPlan", back_populates="blocks")

    # A block cannot be executed until its parent plan is approved. Exposing the
    # plan's status on the block lets the field UI disable "Start" up front,
    # rather than letting a crew click it and hit a 409.
    @property
    def plan_status(self) -> str | None:
        return self.plan.status if self.plan else None

    @property
    def is_startable(self) -> bool:
        return (
            self.status in ("SCHEDULED", "OVERRIDDEN")
            and self.plan_status in ("APPROVED", "IN_EXECUTION")
        )


class PlanApproval(Base):
    __tablename__ = "plan_approvals"

    id = Column(String, primary_key=True, default=gen_uuid)
    plan_id = Column(String, ForeignKey("block_plans.id"), nullable=False)
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan = relationship("BlockPlan", back_populates="approvals")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class KPISnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id = Column(String, primary_key=True, default=gen_uuid)
    date = Column(DateTime, nullable=False)
    aai = Column(Float, nullable=False)
    blocks_executed = Column(Integer, default=0)
    combined_block_rate = Column(Float, default=0.0)
    overdue_rate = Column(Float, default=0.0)
    avg_utilization = Column(Float, default=0.0)
