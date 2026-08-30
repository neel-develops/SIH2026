import React from 'react';
import { ApiDefect } from '../../lib/api';
import { Cpu, Info } from 'lucide-react';

interface AIScoreExplainerProps {
  defect: ApiDefect;
}

export const AIScoreExplainer: React.FC<AIScoreExplainerProps> = ({ defect }) => {
  const daysOverdue = defect.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(defect.due_date).getTime()) / 86400000))
    : 0;

  // Use ai_factors if available, otherwise compute from score
  const factors = defect.ai_factors;
  const overdueContribution = factors?.overdue_days ?? Math.min(30, daysOverdue * 6);
  const tsrContribution = factors?.tsr ?? (defect.requires_tsr ? 25 : 5);
  const failureFreqContribution = factors?.failure_frequency ?? Math.floor(defect.priority_score * 0.25);
  const trafficDensityContribution = factors?.traffic_density ?? Math.floor(defect.priority_score * 0.20);

  return (
    <div className="warm-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={16} color="var(--amber-700)" />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            XGBoost Criticality & Priority Score Explainer
          </span>
        </div>
        <span className="chip chip-amber font-mono" style={{ fontSize: 11 }}>
          Score: {defect.priority_score} / 100
        </span>
      </div>

      <div style={{ background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>CLASSIFICATION LEVEL:</span>
          <span className={`chip ${defect.criticality === 'CRITICAL' ? 'chip-red' : defect.criticality === 'HIGH' ? 'chip-amber' : 'chip-muted'}`} style={{ fontSize: 10 }}>
            {defect.criticality}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Overdue Days */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Days Overdue Weight ({daysOverdue}d)</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)' }}>+{overdueContribution} pts</span>
            </div>
            <div style={{ width: '100%', background: '#fff', height: 6, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
              <div style={{ height: '100%', width: `${(overdueContribution / 30) * 100}%`, background: 'var(--amber-500)', borderRadius: 4 }} />
            </div>
          </div>

          {/* TSR */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>TSR Speed Restriction ({defect.requires_tsr ? 'YES' : 'NO'})</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-critical)' }}>+{tsrContribution} pts</span>
            </div>
            <div style={{ width: '100%', background: '#fff', height: 6, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
              <div style={{ height: '100%', width: `${(tsrContribution / 25) * 100}%`, background: 'var(--rail-critical)', borderRadius: 4 }} />
            </div>
          </div>

          {/* Failure Freq */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>30-Day Section Defect Frequency</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)' }}>+{failureFreqContribution} pts</span>
            </div>
            <div style={{ width: '100%', background: '#fff', height: 6, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
              <div style={{ height: '100%', width: `${(failureFreqContribution / 30) * 100}%`, background: 'var(--rail-eng)', borderRadius: 4 }} />
            </div>
          </div>

          {/* Traffic Density */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Line Passenger & Freight Density</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)' }}>+{trafficDensityContribution} pts</span>
            </div>
            <div style={{ width: '100%', background: '#fff', height: 6, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
              <div style={{ height: '100%', width: `${(trafficDensityContribution / 25) * 100}%`, background: 'var(--amber-700)', borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg-raised)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-muted)' }}>
        <Info size={14} color="var(--amber-700)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, lineHeight: 1.4 }}>
          Priority Score directly determines placement in OR-Tools block optimization solver. Scores &ge; 75 receive priority allocation in next 24h block windows.
        </p>
      </div>
    </div>
  );
};
