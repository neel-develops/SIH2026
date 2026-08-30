import React from 'react';
import { useStore } from '../lib/store/useStore';
import { GanttChart } from '../components/gantt/GanttChart';
import { Layers, Plus, FileText } from 'lucide-react';

export const BlockPlansView: React.FC = () => {
  const { plans, selectedPlanId, setSelectedPlanId, overrideBlock, setCurrentRoute } = useStore();
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  if (!currentPlan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', padding: 40 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No plans available. Generate a new AI plan to get started.</p>
        <button onClick={() => setCurrentRoute('/block-plans/generate')} className="btn-amber" style={{ fontSize: 13 }}>
          <Plus size={15} />
          Generate New AI Plan
        </button>
      </div>
    );
  }

  const totalDefects = currentPlan.blocks.reduce((sum, b) => sum + b.defect_ids.length, 0);
  const combinedCount = currentPlan.blocks.filter((b) => b.is_combined).length;
  const combinedRate = currentPlan.blocks.length > 0
    ? Math.round((combinedCount / currentPlan.blocks.length) * 100)
    : (currentPlan.combined_blocks ?? 0);
  const solveTimeSec = currentPlan.solver_time_ms != null ? (currentPlan.solver_time_ms / 1000).toFixed(1) : 'N/A';

  const metrics = [
    { label: 'Defects Covered', value: `${currentPlan.tasks_scheduled ?? totalDefects}`, color: 'var(--rail-eng)' },
    { label: 'Combined Block Rate', value: `${currentPlan.combined_blocks ?? combinedRate}%`, color: 'var(--amber-700)' },
    { label: 'Conflicts Resolved', value: `${currentPlan.conflicts_resolved ?? 0}`, color: 'var(--rail-snt)' },
    { label: 'Projected AAI', value: currentPlan.aai_after != null ? `${currentPlan.aai_after}%` : 'N/A', color: 'var(--rail-eng)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="warm-card" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Block Schedule & Gantt Management
            </h2>
            <span className={`chip ${currentPlan.status === 'APPROVED' ? 'chip-sage' : 'chip-amber'}`}>
              {currentPlan.status}
            </span>
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            {currentPlan.name} · Type: {currentPlan.plan_type} · Generated: {new Date(currentPlan.created_at).toLocaleDateString()} · Solve Time: {solveTimeSec}s
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
            borderRadius: 10, padding: '7px 12px',
          }}>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Plan:</span>
            <select
              value={currentPlan.id}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="font-mono"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#fff' }}>
                  {p.name} ({p.plan_type} - {p.status})
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setCurrentRoute(`/block-plans/${currentPlan.id}`)} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>
            <FileText size={14} />
            Approval Chain
          </button>

          <button onClick={() => setCurrentRoute('/block-plans/generate')} className="btn-amber" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Plus size={15} />
            Generate New AI Plan
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {metrics.map((m) => (
          <div key={m.label} className="warm-card" style={{ padding: '14px 18px', borderLeft: `4px solid ${m.color}` }}>
            <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              {m.label}
            </span>
            <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: m.color }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <GanttChart blocks={currentPlan.blocks} planId={currentPlan.id} horizonStart={currentPlan.horizon_start} onOverrideBlock={(bId, r) => overrideBlock(currentPlan.id, bId, r)} />
    </div>
  );
};
