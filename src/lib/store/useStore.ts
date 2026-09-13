import { create } from 'zustand';
import {
  api, setToken, getToken,
  ApiUser, ApiDefect, ApiPlan, ApiKPI, ApiBlock,
  ApiLiveExecution, PartialCompleteResponse,
} from '../api';

export type NetworkTier = 'ONLINE' | '3G' | 'OFFLINE';

interface State {
  currentUser: ApiUser | null;
  token: string | null;
  networkTier: NetworkTier;
  currentRoute: string;
  selectedPlanId: string | null;
  selectedDefectId: string | null;

  defects: ApiDefect[];
  plans: ApiPlan[];
  kpi: ApiKPI | null;
  live: ApiLiveExecution | null;
  liveLoading: boolean;

  filterDept: string;
  filterCriticality: string;
  filterSection: string;
  searchQuery: string;

  lang: 'EN' | 'HI';
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;

  setNetworkTier: (tier: NetworkTier) => void;
  setCurrentRoute: (route: string) => void;
  setSelectedPlanId: (id: string | null) => void;
  setSelectedDefectId: (id: string | null) => void;
  setFilterDept: (dept: string) => void;
  setFilterCriticality: (crit: string) => void;
  setFilterSection: (sec: string) => void;
  setSearchQuery: (q: string) => void;
  setLang: (lang: 'EN' | 'HI') => void;

  fetchDefects: (params?: Record<string, string>) => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchKPI: () => Promise<void>;
  fetchLive: () => Promise<void>;
  fetchAll: () => Promise<void>;

  // Block execution lifecycle
  startBlock: (blockId: string, teamLeader?: string) => Promise<ApiBlock>;
  reportProgress: (blockId: string, completedDefectIds: string[]) => Promise<ApiBlock>;
  partialComplete: (blockId: string, completedDefectIds: string[], reason: string) => Promise<PartialCompleteResponse>;
  completeBlock: (blockId: string, remarks?: string) => Promise<ApiBlock>;
  resetDemo: () => Promise<void>;

  createDefect: (data: Record<string, unknown>) => Promise<ApiDefect>;
  generatePlan: (data: Record<string, unknown>) => Promise<ApiPlan>;
  approvePlan: (planId: string, action: string, comment?: string) => Promise<{ status: string; message: string }>;
  overrideBlock: (planId: string, blockId: string, reason: string) => Promise<void>;
  updateBlockStatus: (planId: string, blockId: string, status: string, actualStart?: string, actualEnd?: string) => Promise<void>;
}

function landingRoute(role: string): string {
  if (role === 'JUNIOR_ENGINEER') return '/field';
  if (role === 'DIVISIONAL_BLOCK_PLANNER') return '/block-plans';
  if (role === 'SUPER_ADMIN' || role === 'ZONAL_ADMIN') return '/admin/users';
  if (role === 'READ_ONLY_VIEWER') return '/reports';
  if (role.startsWith('SSE_')) return '/defects';
  return '/dashboard';
}

export const useStore = create<State>((set, get) => ({
  currentUser: null,
  token: null,
  networkTier: 'ONLINE',
  currentRoute: '/login',
  selectedPlanId: null,
  selectedDefectId: null,

  defects: [],
  plans: [],
  kpi: null,
  live: null,
  liveLoading: false,

  filterDept: 'ALL',
  filterCriticality: 'ALL',
  filterSection: 'ALL',
  searchQuery: '',

  lang: 'EN',
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.auth.login(email, password);
      setToken(res.access_token);
      set({
        currentUser: res.user,
        token: res.access_token,
        currentRoute: landingRoute(res.user.role),
        loading: false,
      });
      get().fetchAll();
    } catch (e: any) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  demoLogin: async (role) => {
    set({ loading: true, error: null });
    try {
      const res = await api.auth.demoLogin(role);
      setToken(res.access_token);
      set({
        currentUser: res.user,
        token: res.access_token,
        currentRoute: landingRoute(res.user.role),
        loading: false,
      });
      get().fetchAll();
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  logout: () => {
    setToken(null);
    set({
      currentUser: null,
      token: null,
      currentRoute: '/login',
      defects: [],
      plans: [],
      kpi: null,
      live: null,
    });
  },

  restoreSession: async () => {
    const token = getToken();
    if (!token) return false;
    try {
      const user = await api.auth.me();
      set({ currentUser: user, token, currentRoute: landingRoute(user.role) });
      get().fetchAll();
      return true;
    } catch {
      setToken(null);
      return false;
    }
  },

  setNetworkTier: (tier) => set({ networkTier: tier }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  setSelectedDefectId: (id) => set({ selectedDefectId: id }),
  setFilterDept: (dept) => set({ filterDept: dept }),
  setFilterCriticality: (crit) => set({ filterCriticality: crit }),
  setFilterSection: (sec) => set({ filterSection: sec }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLang: (lang) => set({ lang }),

  fetchDefects: async (params) => {
    try {
      const defects = await api.defects.list(params);
      set({ defects });
    } catch (e) {
      console.error('Failed to fetch defects:', e);
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await api.plans.list();
      set({ plans });
      if (plans.length > 0 && !get().selectedPlanId) {
        set({ selectedPlanId: plans[0].id });
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    }
  },

  fetchKPI: async () => {
    try {
      const kpi = await api.kpi();
      set({ kpi });
    } catch (e) {
      console.error('Failed to fetch KPI:', e);
    }
  },

  fetchLive: async () => {
    set({ liveLoading: true });
    try {
      const live = await api.execution.live();
      set({ live, liveLoading: false });
    } catch (e) {
      console.error('Failed to fetch live execution:', e);
      set({ liveLoading: false });
    }
  },

  fetchAll: async () => {
    const { fetchDefects, fetchPlans, fetchKPI, fetchLive } = get();
    await Promise.all([fetchDefects({ limit: '300' }), fetchPlans(), fetchKPI(), fetchLive()]);
  },

  createDefect: async (data) => {
    const defect = await api.defects.create(data as any);
    set({ defects: [defect, ...get().defects] });
    return defect;
  },

  generatePlan: async (data) => {
    set({ loading: true });
    try {
      const plan = await api.plans.generate(data as any);
      set({
        plans: [plan, ...get().plans],
        selectedPlanId: plan.id,
        loading: false,
      });
      get().fetchKPI();
      return plan;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  // Returns the plan's resulting status. The backend runs a two-tier chain —
  // a Divisional Planner's first approval does NOT finalise a plan — so callers
  // must report what actually happened rather than assuming success.
  approvePlan: async (planId, action, comment) => {
    const res = await api.plans.approve(planId, action, comment);
    await get().fetchPlans();
    return res;
  },

  overrideBlock: async (planId, blockId, reason) => {
    await api.plans.overrideBlock(planId, blockId, reason);
    await get().fetchPlans();
  },

  updateBlockStatus: async (planId, blockId, status, actualStart, actualEnd) => {
    await api.plans.updateBlockStatus(planId, blockId, status, actualStart, actualEnd);
    await get().fetchPlans();
  },

  // ── Block execution lifecycle ─────────────────────────────────────────────
  // Each transition refreshes the live feed and plans so the Gantt, the control
  // room and the defect queue all stay in step with one another.

  startBlock: async (blockId, teamLeader) => {
    const block = await api.execution.start(blockId, teamLeader);
    await Promise.all([get().fetchLive(), get().fetchPlans()]);
    return block;
  },

  reportProgress: async (blockId, completedDefectIds) => {
    const block = await api.execution.progress(blockId, completedDefectIds);
    await get().fetchLive();
    return block;
  },

  partialComplete: async (blockId, completedDefectIds, reason) => {
    const res = await api.execution.partial(blockId, completedDefectIds, reason);
    await Promise.all([get().fetchLive(), get().fetchPlans(), get().fetchDefects({ limit: '300' })]);
    return res;
  },

  completeBlock: async (blockId, remarks) => {
    const block = await api.execution.complete(blockId, remarks);
    await Promise.all([
      get().fetchLive(), get().fetchPlans(),
      get().fetchDefects({ limit: '300' }), get().fetchKPI(),
    ]);
    return block;
  },

  resetDemo: async () => {
    await api.execution.resetDemo();
    await get().fetchAll();
  },
}));
