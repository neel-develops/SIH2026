import { create } from 'zustand';
import { User, Defect, BlockPlan, KPISnapshot, Department, Criticality } from '../../types';
import { SEEDED_USERS, SEEDED_DEFECTS, SEEDED_PLANS, SEEDED_KPI } from '../mocks/seedData';
import { db } from '../db/dexie';

export type NetworkTier = 'ONLINE' | '3G' | 'OFFLINE';

interface State {
  currentUser: User;
  networkTier: NetworkTier;
  currentRoute: string; // '/dashboard', '/block-plans', etc.
  selectedPlanId: string | null;
  selectedDefectId: string | null;
  
  // Data lists
  defects: Defect[];
  plans: BlockPlan[];
  kpi: KPISnapshot;
  
  // Filters
  filterDept: Department | 'ALL';
  filterCriticality: Criticality | 'ALL';
  filterSection: string | 'ALL';
  searchQuery: string;

  // Language
  lang: 'EN' | 'HI';

  // Actions
  setCurrentUser: (user: User) => void;
  setNetworkTier: (tier: NetworkTier) => void;
  setCurrentRoute: (route: string) => void;
  setSelectedPlanId: (id: string | null) => void;
  setSelectedDefectId: (id: string | null) => void;
  setFilterDept: (dept: Department | 'ALL') => void;
  setFilterCriticality: (crit: Criticality | 'ALL') => void;
  setFilterSection: (sec: string | 'ALL') => void;
  setSearchQuery: (q: string) => void;
  setLang: (lang: 'EN' | 'HI') => void;

  // Mutators
  addDefect: (defect: Omit<Defect, 'id' | 'reportedAt' | 'priorityScore' | 'daysOverdue'>) => Promise<void>;
  overrideBlock: (planId: string, blockId: string, reason: string) => void;
  approvePlan: (planId: string, userRole: string, userName: string, note?: string) => void;
  generateNewPlan: (newPlan: BlockPlan) => void;
}

export const useStore = create<State>((set, get) => ({
  currentUser: SEEDED_USERS[0], // Divisional Block Planner default
  networkTier: 'ONLINE',
  currentRoute: '/dashboard',
  selectedPlanId: 'BLK-2026-WK13',
  selectedDefectId: 'TMS-2026-4001',

  defects: SEEDED_DEFECTS,
  plans: SEEDED_PLANS,
  kpi: SEEDED_KPI,

  filterDept: 'ALL',
  filterCriticality: 'ALL',
  filterSection: 'ALL',
  searchQuery: '',

  lang: 'EN',

  setCurrentUser: (user) => {
    // Route user to their role-specific landing page
    let landingRoute = '/dashboard';
    if (user.role === 'JUNIOR_ENGINEER') landingRoute = '/field';
    else if (user.role === 'DIVISIONAL_BLOCK_PLANNER') landingRoute = '/block-plans';
    else if (user.role === 'SENIOR_OFFICER') landingRoute = '/dashboard';
    else if (user.role === 'SUPER_ADMIN' || user.role === 'ZONAL_ADMIN') landingRoute = '/admin/users';
    else if (user.role === 'READ_ONLY_VIEWER') landingRoute = '/map';
    else if (user.role.startsWith('SSE_')) landingRoute = '/defects';

    set({ currentUser: user, currentRoute: landingRoute });
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

  addDefect: async (newDefectData) => {
    const state = get();
    const newId = `${newDefectData.source}-2026-${Math.floor(Math.random() * 9000) + 1000}`;
    const newDefect: Defect = {
      ...newDefectData,
      id: newId,
      reportedAt: new Date().toISOString(),
      daysOverdue: 0,
      priorityScore: Math.floor(Math.random() * 30) + 60,
    };

    set({ defects: [newDefect, ...state.defects] });

    // Store in IndexedDB
    try {
      await db.defects.add(newDefect);
      if (state.networkTier === 'OFFLINE') {
        await db.queuedSubmissions.add({
          type: 'NEW_DEFECT',
          payload: newDefect,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        });
      }
    } catch (e) {
      console.warn('IndexedDB write warning:', e);
    }
  },

  overrideBlock: (planId, blockId, reason) => {
    const state = get();
    const updatedPlans = state.plans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        blocks: plan.blocks.map(blk => {
          if (blk.id !== blockId) return blk;
          return {
            ...blk,
            manuallyOverridden: true,
            overrideReason: reason
          };
        })
      };
    });
    set({ plans: updatedPlans });
  },

  approvePlan: (planId, userRole, userName, note) => {
    const state = get();
    const updatedPlans = state.plans.map(plan => {
      if (plan.id !== planId) return plan;
      const newApprovals = [
        ...plan.approvals,
        { role: userRole, user: userName, action: 'APPROVED' as const, reason: note, at: new Date().toISOString() }
      ];
      // If Senior Officer approved, set plan status to APPROVED
      const isFinalApproval = userRole === 'SENIOR_OFFICER' || newApprovals.length >= 2;
      return {
        ...plan,
        status: isFinalApproval ? ('APPROVED' as const) : ('PENDING_APPROVAL' as const),
        approvals: newApprovals
      };
    });
    set({ plans: updatedPlans });
  },

  generateNewPlan: (newPlan) => {
    const state = get();
    set({
      plans: [newPlan, ...state.plans],
      selectedPlanId: newPlan.id
    });
  }
}));
