export type Department = 'ENG' | 'SNT' | 'TD';
export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DefectStatus = 'OPEN' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';

export interface Defect {
  id: string;                    // "TMS-2026-04417"
  source: 'TMS' | 'SMMS' | 'TDMS';
  department: Department;
  assetType: string;             // "Rail fracture" | "Point machine" | "OHE dropper"
  description: string;
  sectionId: string;             // "CSTM-PUNE"
  blockSection: string;          // "KYN-KSRA"
  kmPost: number;                // 42.350
  lat: number; lng: number;
  reportedAt: string;            // ISO
  dueBy: string;
  daysOverdue: number;
  estimatedDurationMin: number;
  criticality: Criticality;
  priorityScore: number;         // 0-100, from the XGBoost classifier
  tsrImposed: boolean;
  status: DefectStatus;
  reportedBy: string;            // "SSE/ENG/KYN"
  photoUrl?: string;
}

export interface BlockWindow {              // a train-free gap from COA/NTES
  id: string;
  blockSection: string;
  start: string; end: string;
  trafficDensityScore: number;       // 0-100, lower = better window
  conflictingTrains: { trainNo: string; name: string; scheduledAt: string }[];
}

export interface Block {                    // a scheduled block in the plan
  id: string;                        // "BLK-2026-0331-07"
  planId: string;
  blockType: 'TRAFFIC' | 'ENGINEERING' | 'POWER' | 'SIGNAL' | 'COMBINED';
  departments: Department[];         // length > 1 => combined
  blockSection: string;
  kmFrom: number; kmTo: number;
  start: string; end: string;
  defectIds: string[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  utilisationPct: number;
  aiConfidence: number;              // 0-1
  aiRationale: string;               // "Clustered 3 tasks within 1.2 km; ENG+TD share isolation."
  manuallyOverridden: boolean;
  overrideReason?: string;
}

export interface BlockPlan {
  id: string;
  horizon: 'WEEKLY' | 'MONTHLY';
  sectionId: string;
  generatedAt: string;
  solveTimeSec: number;              // 38.2
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  blocks: Block[];
  metrics: {
    defectsScheduled: number; defectsTotal: number;
    combinedBlockRatePct: number;    // 43
    downtimeReductionPct: number;    // 37
    utilisationPct: number;          // 85
    projectedAAI: number;            // 91.2
  };
  approvals: { role: string; user: string; action: 'APPROVED'|'REJECTED'; reason?: string; at: string }[];
}

export interface KPISnapshot {
  aaiCurrent: number; aaiBaseline: number; aaiTarget: number;
  blocksToday: number; blocksThisWeek: number;
  openDefects: number; overdueDefects: number; criticalDefects: number;
  pendingApprovals: number;
  utilisationPct: number; combinedBlockRatePct: number;
  aaiTrend: { date: string; value: number }[];          // 90 days
  defectsByDept: { department: Department; open: number; overdue: number }[];
}

export type Role =
  | 'SUPER_ADMIN' | 'ZONAL_ADMIN' | 'DIVISIONAL_BLOCK_PLANNER' | 'SENIOR_OFFICER'
  | 'SSE_ENGINEERING' | 'SSE_SIGNAL_TELECOM' | 'SSE_TRACTION_DISTRIBUTION'
  | 'JUNIOR_ENGINEER' | 'READ_ONLY_VIEWER';

export interface User {
  id: string; name: string; email: string; role: Role;
  department?: Department;
  scope: { zone: string; division: string; sections: string[] };
  designation: string;                // "SSE — Engineering, Kalyan"
}
