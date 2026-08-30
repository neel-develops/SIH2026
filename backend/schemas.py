from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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


class DefectOut(BaseModel):
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


class BlockOut(BaseModel):
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

    class Config:
        from_attributes = True


class PlanApprovalOut(BaseModel):
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


class BlockPlanOut(BaseModel):
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
