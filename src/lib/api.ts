const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('railsync_token', token);
  else localStorage.removeItem('railsync_token');
}

export function getToken(): string | null {
  if (!authToken) authToken = localStorage.getItem('railsync_token');
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  zone: string;
  division: string;
  assigned_sections: string[];
  mfa_enabled: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    demoLogin: (role: string) =>
      request<LoginResponse>(`/api/v1/auth/demo-login/${role}`, { method: 'POST' }),

    me: () => request<ApiUser>('/api/v1/auth/me'),
  },

  // ── Defects ─────────────────────────────────────────────────────────────

  defects: {
    list: (params?: {
      department?: string;
      criticality?: string;
      status?: string;
      section?: string;
      search?: string;
      skip?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
        });
      }
      return request<ApiDefect[]>(`/api/v1/defects/?${searchParams}`);
    },

    stats: () => request<DefectStats>('/api/v1/defects/stats'),

    get: (id: string) => request<ApiDefect>(`/api/v1/defects/${id}`),

    create: (data: CreateDefectRequest) =>
      request<ApiDefect>('/api/v1/defects/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ── Plans ───────────────────────────────────────────────────────────────

  plans: {
    list: () => request<ApiPlan[]>('/api/v1/plans/'),

    get: (id: string) => request<ApiPlan>(`/api/v1/plans/${id}`),

    generate: (data: GeneratePlanRequest) =>
      request<ApiPlan>('/api/v1/plans/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    approve: (planId: string, action: string, comment?: string) =>
      request<{ status: string; message: string }>(`/api/v1/plans/${planId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action, comment }),
      }),

    overrideBlock: (planId: string, blockId: string, reason: string) =>
      request<ApiBlock>(`/api/v1/plans/${planId}/blocks/${blockId}/override`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    updateBlockStatus: (planId: string, blockId: string, status: string, actualStart?: string, actualEnd?: string) =>
      request<ApiBlock>(`/api/v1/plans/${planId}/blocks/${blockId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, actual_start: actualStart, actual_end: actualEnd }),
      }),
  },

  // ── KPI & Reports ─────────────────────────────────────────────────────

  kpi: () => request<ApiKPI>('/api/v1/kpi'),

  reports: {
    get: () => request<ApiReport>('/api/v1/reports'),

    exportExcel: () =>
      fetch(`${BASE_URL}/api/v1/reports/export/excel`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(res => res.blob()),

    exportPdf: () =>
      fetch(`${BASE_URL}/api/v1/reports/export/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(res => res.blob()),
  },

  // ── Users ───────────────────────────────────────────────────────────────

  users: {
    list: () => request<ApiUser[]>('/api/v1/users/'),

    create: (data: CreateUserRequest) =>
      request<ApiUser>('/api/v1/users/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Record<string, unknown>) =>
      request<ApiUser>(`/api/v1/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ── Block Execution Lifecycle ───────────────────────────────────────────
  // SCHEDULED → IN_PROGRESS → PARTIALLY_DONE → COMPLETED

  execution: {
    start: (blockId: string, teamLeader?: string) =>
      request<ApiBlock>(`/api/v1/execution/blocks/${blockId}/start`, {
        method: 'POST',
        body: JSON.stringify({ team_leader: teamLeader }),
      }),

    progress: (blockId: string, completedDefectIds: string[], note?: string) =>
      request<ApiBlock>(`/api/v1/execution/blocks/${blockId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ completed_defect_ids: completedDefectIds, note }),
      }),

    partial: (blockId: string, completedDefectIds: string[], reason: string) =>
      request<PartialCompleteResponse>(`/api/v1/execution/blocks/${blockId}/partial`, {
        method: 'POST',
        body: JSON.stringify({ completed_defect_ids: completedDefectIds, reason }),
      }),

    complete: (blockId: string, remarks?: string) =>
      request<ApiBlock>(`/api/v1/execution/blocks/${blockId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      }),

    live: () => request<ApiLiveExecution>('/api/v1/execution/live'),

    resetDemo: () =>
      request<{ status: string; defects_reopened: number; message: string }>(
        '/api/v1/execution/demo/reset',
        { method: 'POST' },
      ),
  },

  // ── AI / LLM ─────────────────────────────────────────────────────────────

  ai: {
    smartDefect: (text: string) =>
      request<ApiDefect>('/api/v1/ai/smart-defect', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),

    chat: (message: string) =>
      request<{ reply: string; context_used: boolean }>('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),

    executiveSummary: () =>
      request<{ summary: string; generated_at: string }>('/api/v1/ai/executive-summary'),

    blockRationale: (planId: string, blockId: string) =>
      request<{ rationale: string; block_id: string }>('/api/v1/ai/block-rationale', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, block_id: blockId }),
      }),

    defectInsights: () =>
      request<{ insights: string; stats: Record<string, unknown> }>('/api/v1/ai/defect-insights'),
  },
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface ApiDefect {
  id: string;
  source_system: string;
  external_defect_id: string | null;
  section: string;
  km_from: number;
  km_to: number | null;
  defect_type: string;
  asset_type: string | null;
  description: string | null;
  reported_date: string;
  due_date: string | null;
  criticality: string;
  priority_score: number;
  ai_factors: Record<string, number> | null;
  status: string;
  department: string;
  reported_by: string | null;
  requires_tsr: boolean;
  estimated_duration_hrs: number;
  failure_frequency: number;
  traffic_density: number;
  created_at: string;
}

export interface DefectStats {
  total: number;
  open: number;
  in_progress: number;
  scheduled: number;
  completed: number;
  overdue: number;
  critical: number;
  high: number;
  by_department: Record<string, number>;
}

export interface CreateDefectRequest {
  section: string;
  km_from: number;
  km_to?: number;
  defect_type: string;
  asset_type?: string;
  description?: string;
  criticality: string;
  department: string;
  reported_by?: string;
  requires_tsr?: boolean;
  estimated_duration_hrs?: number;
}

export type BlockStatus =
  | 'SCHEDULED' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'COMPLETED' | 'OVERRIDDEN';

export interface ExecutionLogEntry {
  event: string;
  actor: string;
  detail: string;
  at: string;
  [key: string]: unknown;
}

export interface ApiBlock {
  id: string;
  plan_id: string;
  section: string;
  department: string;
  block_type: string;
  defect_ids: string[];
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  duration_hrs: number;
  is_combined: boolean;
  combined_departments: string[] | null;
  ai_confidence: number;
  ai_rationale: string | null;
  status: BlockStatus | string;
  override_reason: string | null;
  overridden_by: string | null;
  team_leader: string | null;

  /** Status of the parent plan — work may only begin once it is approved. */
  plan_status: string | null;
  is_startable: boolean;

  // Execution tracking
  progress_pct: number;
  completed_defect_ids: string[];
  pending_defect_ids: string[];
  partial_reason: string | null;
  execution_log: ExecutionLogEntry[];
  actual_duration_hrs: number | null;
  overrun_min: number;
  started_by: string | null;
  completed_by: string | null;

  // AI carry-forward chain
  carried_forward_from: string | null;
  carried_forward_to: string | null;
  carry_forward_generation: number;
}

export interface PartialCompleteResponse {
  block: ApiBlock;
  carry_forward: ApiBlock | null;
  escalation: {
    reason: string;
    pending_defect_ids: string[];
    message: string;
  } | null;
}

export interface AtRiskBlock {
  block_id: string;
  section: string;
  severity: 'OVERRUN' | 'HIGH' | 'MEDIUM';
  elapsed_hrs: number;
  planned_hrs: number;
  progress_pct: number;
  overrun_min: number;
  message: string;
}

export interface CarryForwardChain {
  block_id: string;
  parent_block_id: string;
  section: string;
  generation: number;
  defect_count: number;
  scheduled_start: string;
  status: string;
  ai_rationale: string | null;
}

/** A defect as it appears on a block's execution checklist. */
export interface BlockTask {
  id: string;
  defect_type: string;
  asset_type: string | null;
  section: string;
  km_from: number;
  department: string;
  criticality: string;
  priority_score: number;
  estimated_duration_hrs: number;
  requires_tsr: boolean;
  status: string;
}

export interface ApiLiveExecution {
  server_time: string;
  active_blocks: ApiBlock[];
  partial_blocks: ApiBlock[];
  upcoming_blocks: ApiBlock[];
  recent_completions: ApiBlock[];
  at_risk: AtRiskBlock[];
  carry_forward_chains: CarryForwardChain[];
  /** Task details for every defect referenced above, keyed by defect id. */
  tasks: Record<string, BlockTask>;
  stats: {
    active_count: number;
    partial_count: number;
    upcoming_count: number;
    completed_count: number;
    at_risk_count: number;
    carry_forward_count: number;
    carry_forward_defects: number;
    on_time_rate: number;
    avg_actual_hrs: number;
    total_overrun_min: number;
  };
}

export interface ApiApproval {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  role: string;
  action: string;
  comment: string | null;
  created_at: string;
}

export interface ApiPlan {
  id: string;
  name: string;
  plan_type: string;
  horizon_start: string;
  horizon_end: string;
  division: string;
  status: string;
  generated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  solver_time_ms: number | null;
  objective_score: number | null;
  tasks_scheduled: number | null;
  conflicts_resolved: number | null;
  combined_blocks: number | null;
  aai_before: number | null;
  aai_after: number | null;
  blocks: ApiBlock[];
  approvals: ApiApproval[];
}

export interface GeneratePlanRequest {
  plan_type?: string;
  horizon_days?: number;
  enable_combined_blocks?: boolean;
  corridor?: string;
}

export interface ApiKPI {
  aai_current: number;
  aai_trend: { date: string; aai: number }[];
  blocks_today: number;
  open_defects: number;
  overdue_defects: number;
  pending_approvals: number;
  block_utilization: number;
  combined_block_rate: number;
  department_breakdown: Record<string, number>;
  section_workload: { section: string; defects: number; blocks: number }[];
}

export interface ApiReport {
  compliance_data: { section: string; planned: number; completed: number; rate: number }[];
  department_distribution: Record<string, number>;
  before_after: Record<string, unknown>;
  aai_trend: { date: string; aai: number }[];
  summary: Record<string, unknown>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  zone?: string;
  division?: string;
  assigned_sections?: string[];
}
