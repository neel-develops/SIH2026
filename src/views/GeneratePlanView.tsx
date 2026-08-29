import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { SolverAnimation } from '../components/ai/SolverAnimation';
import { Cpu, Play, Settings } from 'lucide-react';
import { BlockPlan } from '../types';

export const GeneratePlanView: React.FC = () => {
  const { generateNewPlan, setCurrentRoute } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [horizon, setHorizon] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [allowCombined, setAllowCombined] = useState(true);

  const handleSolverComplete = (newPlan: BlockPlan) => {
    generateNewPlan(newPlan);
    setCurrentRoute('/block-plans');
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {!isGenerating ? (
        <div className="warm-card" style={{ padding: '32px 36px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--amber-100)', border: '2px solid var(--amber-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={26} color="var(--amber-700)" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
                AI Block Plan Generator & Optimizer
              </h2>
              <p className="font-mono" style={{ fontSize: 12, color: 'var(--amber-700)', margin: 0 }}>
                Google OR-Tools CP-SAT Solver + XGBoost Criticality Matrix
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Time Horizon */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Time Horizon
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['WEEKLY', 'MONTHLY'] as const).map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    style={{
                      padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                      fontWeight: 700, fontSize: 13, border: '1.5px solid',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: horizon === h ? 'var(--amber-700)' : 'var(--bg-raised)',
                      color: horizon === h ? '#fff' : 'var(--text-secondary)',
                      borderColor: horizon === h ? 'var(--amber-700)' : 'var(--border-soft)',
                    }}
                  >
                    {h === 'WEEKLY' ? '7-Day Weekly' : '30-Day Monthly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Corridor scope */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Corridor Section Scope
              </label>
              <input
                disabled
                value="CSTM-PUNE (Central Railway / Mumbai Div)"
                className="warm-input font-mono"
                style={{ opacity: 0.7, cursor: 'not-allowed', fontSize: 12 }}
              />
            </div>
          </div>

          {/* Parameters */}
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Settings size={15} color="var(--amber-700)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Optimization Parameters & Constraints</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                  Allow Cross-Department Combined Blocks
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Clusters adjacent ENG + S&T + TD tasks into single maintenance window
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowCombined}
                onChange={(e) => setAllowCombined(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--amber-700)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsGenerating(true)}
            className="btn-amber"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '14px 0' }}
          >
            <Play size={18} />
            Run Google OR-Tools Solver (Generate Plan)
          </button>
        </div>
      ) : (
        <SolverAnimation onComplete={handleSolverComplete} />
      )}
    </div>
  );
};
