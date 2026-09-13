from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator


class UTCModel(BaseModel):
    """Base schema that stamps every naive datetime as UTC before serialising.

    The ORM stores naive `datetime.utcnow()` values. Serialised without an
    offset, `new Date("2026-09-01T18:04:00")` in the browser is interpreted as
    *local* time — so on an IST machine every timestamp lands 5h30m out and the
    elapsed-time counters and Gantt bars drift by that much. Tagging the values
    as UTC on the way out makes the client parse them correctly.
    """

    @model_validator(mode="after")
    def _stamp_utc(self):
        for name in type(self).model_fields:
            value = getattr(self, name, None)
            if isinstance(value, datetime) and value.tzinfo is None:
                object.__setattr__(self, name, value.replace(tzinfo=timezone.utc))
        return self


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    zone: str
    division: str
    assigned_sections: list = []
    mfa_enabled: bool = False

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: Optional[str] = None
    zone: str = "CR"
    division: str = "Mumbai"
    assigned_sections: list = []


class DefectOut(UTCModel):
    id: str
    source_system: str
    external_defect_id: Optional[str] = None
    section: str
    km_from: float
    km_to: Optional[float] = None
    defect_type: str
    asset_type: Optional[str] = None
    description: Optional[str] = None
    reported_date: datetime
    due_date: Optional[datetime] = None
    criticality: str
    priority_score: float
    ai_factors: Optional[dict] = None
    status: str
    department: str
    reported_by: Optional[str] = None
    requires_tsr: bool = False
    estimated_duration_hrs: float = 2.0
    failure_frequency: int = 1
    traffic_density: float = 0.5
    created_at: datetime

    class Config:
        from_attributes = True


class DefectCreate(BaseModel):
    section: str
    km_from: float
    km_to: Optional[float] = None
    defect_type: str
    asset_type: Optional[str] = None
    description: Optional[str] = None
    criticality: str
    department: str
    reported_by: Optional[str] = None
    requires_tsr: bool = False
    estimated_duration_hrs: float = 2.0


class BlockOut(UTCModel):
    id: str
    plan_id: str
    section: str
    department: str
    block_type: str
    defect_ids: list = []
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    duration_hrs: float
    is_combined: bool = False
    combined_departments: Optional[list] = None
    ai_confidence: float
    ai_rationale: Optional[str] = None
    status: str
    override_reason: Optional[str] = None
    overridden_by: Optional[str] = None
    team_leader: Optional[str] = None

    # Governance: work may only begin once the parent plan is approved.
    plan_status: Optional[str] = None
    is_startable: bool = False

    # Execution tracking
    progress_pct: float = 0.0
    completed_defect_ids: list = []
    pending_defect_ids: list = []
    partial_reason: Optional[str] = None
    execution_log: list = []
    actual_duration_hrs: Optional[float] = None
    overrun_min: float = 0.0
    started_by: Optional[str] = None
    completed_by: Optional[str] = None

    # AI carry-forward chain
    carried_forward_from: Optional[str] = None
    carried_forward_to: Optional[str] = None
    carry_forward_generation: int = 0

    # Rows that predate the execution-tracking columns carry NULL rather than an
    # empty list/zero, because SQLite cannot backfill a callable default.
    @field_validator(
        "defect_ids", "completed_defect_ids", "pending_defect_ids", "execution_log",
        mode="before",
    )
    @classmethod
    def _null_to_empty_list(cls, v):
        return [] if v is None else v

    @field_validator("progress_pct", "overrun_min", "carry_forward_generation", mode="before")
    @classmethod
    def _null_to_zero(cls, v):
        return 0 if v is None else v

    class Config:
        from_attributes = True


class PlanApprovalOut(UTCModel):
    id: str
    plan_id: str
    user_id: str
    user_name: str
    role: str
    action: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BlockPlanOut(UTCModel):
    id: str
    name: str
    plan_type: str
    horizon_start: datetime
    horizon_end: datetime
    division: str
    status: str
    generated_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    solver_time_ms: Optional[int] = None
    objective_score: Optional[float] = None
    tasks_scheduled: Optional[int] = None
    conflicts_resolved: Optional[int] = None
    combined_blocks: Optional[int] = None
    aai_before: Optional[float] = None
    aai_after: Optional[float] = None
    blocks: list[BlockOut] = []
    approvals: list[PlanApprovalOut] = []

    class Config:
        from_attributes = True


class GeneratePlanRequest(BaseModel):
    plan_type: str = "WEEKLY"
    horizon_days: int = 7
    enable_combined_blocks: bool = True
    corridor: str = "CSTM-PUNE"


class ApprovalRequest(BaseModel):
    action: str
    comment: Optional[str] = None


class OverrideRequest(BaseModel):
    new_start: Optional[datetime] = None
    new_end: Optional[datetime] = None
    reason: str


class BlockStatusUpdate(BaseModel):
    status: str
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None


# ── Execution lifecycle ─────────────────────────────────────────────────────

class StartBlockRequest(BaseModel):
    team_leader: Optional[str] = None
    remarks: Optional[str] = None


class ProgressUpdateRequest(BaseModel):
    completed_defect_ids: list[str] = []
    note: Optional[str] = None


class PartialCompleteRequest(BaseModel):
    completed_defect_ids: list[str] = []
    reason: str


class CompleteBlockRequest(BaseModel):
    remarks: Optional[str] = None


class BlockTaskOut(BaseModel):
    """A defect as it appears on a block's execution checklist."""
    id: str
    defect_type: str
    asset_type: Optional[str] = None
    section: str
    km_from: float
    department: str
    criticality: str
    priority_score: float
    estimated_duration_hrs: float
    requires_tsr: bool = False
    status: str

    class Config:
        from_attributes = True


class LiveExecutionOut(UTCModel):
    server_time: datetime
    active_blocks: list[BlockOut] = []
    partial_blocks: list[BlockOut] = []
    upcoming_blocks: list[BlockOut] = []
    recent_completions: list[BlockOut] = []
    at_risk: list[dict] = []
    carry_forward_chains: list[dict] = []
    stats: dict = {}

    # Task details for every defect referenced by the blocks above, keyed by
    # defect id. A combined block spans departments by design, so a crew
    # operating it must see all of its tasks even when the defect *queue* is
    # scoped to their own department.
    tasks: dict[str, BlockTaskOut] = {}


class KPIOut(BaseModel):
    aai_current: float
    aai_trend: list[dict]
    blocks_today: int
    open_defects: int
    overdue_defects: int
    pending_approvals: int
    block_utilization: float
    combined_block_rate: float
    department_breakdown: dict
    section_workload: list[dict]


class ReportOut(BaseModel):
    compliance_data: list[dict]
    department_distribution: dict
    before_after: dict
    aai_trend: list[dict]
    summary: dict
