import Dexie, { Table } from 'dexie';
import { Defect, BlockPlan, KPISnapshot } from '../../types';

export interface QueuedSubmission {
  id?: number;
  type: 'NEW_DEFECT' | 'BLOCK_STATUS_UPDATE';
  payload: any;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export class RailSyncDatabase extends Dexie {
  defects!: Table<Defect>;
  blockPlans!: Table<BlockPlan>;
  kpiSnapshot!: Table<KPISnapshot & { id: string }>;
  queuedSubmissions!: Table<QueuedSubmission>;

  constructor() {
    super('RailSyncDatabase');
    this.version(1).stores({
      defects: 'id, department, criticality, status, sectionId, blockSection',
      blockPlans: 'id, horizon, sectionId, status',
      kpiSnapshot: 'id',
      queuedSubmissions: '++id, type, status, createdAt'
    });
  }
}

export const db = new RailSyncDatabase();
