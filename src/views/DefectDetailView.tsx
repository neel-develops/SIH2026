import React from 'react';
import { useStore } from '../lib/store/useStore';
import { AIScoreExplainer } from '../components/defects/AIScoreExplainer';
import { ArrowLeft, Clock, CheckCircle2, Layers } from 'lucide-react';

export const DefectDetailView: React.FC = () => {
  const { defects, selectedDefectId, setCurrentRoute } = useStore();
  const defect = defects.find((d) => d.id === selectedDefectId) || defects[0];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button
        onClick={() => setCurrentRoute('/defects')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--rail-eng)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Defect Queue</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left Column: Full Details & Timeline */}
        <div className="warm-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
            <div>
              <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber-700)', display: 'block' }}>{defect.id}</span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{defect.source} Database Feed</span>
            </div>
            <span className="chip" style={{
              fontSize: 10,
              background: defect.department === 'ENG' ? 'var(--rail-eng)' : defect.department === 'SNT' ? 'var(--rail-snt)' : 'var(--rail-td)',
              color: '#fff', border: 'none',
            }}>
              {defect.department} DEPARTMENT
            </span>
          </div>

          <div style={{ background: 'var(--bg-raised)', padding: '16px 18px', borderRadius: 14, border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>ASSET & DEFECT DESCRIPTION</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginTop: 2 }}>{defect.assetType}</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0, lineHeight: 1.5 }}>{defect.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>LOCATION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{defect.blockSection} (KM {defect.kmPost})</span>
              </div>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>TSR SPEED RESTRICTION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: defect.tsrImposed ? 'var(--rail-critical)' : 'var(--text-muted)' }}>
                  {defect.tsrImposed ? 'IMPOSED (30 KM/H)' : 'NONE'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>REPORTED BY</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{defect.reportedBy}</span>
              </div>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>ESTIMATED BLOCK DURATION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-700)' }}>{defect.estimatedDurationMin} minutes</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-soft)' }}>
              Defect Status Timeline
            </span>
            <div className="font-mono" style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--rail-snt)' }}>
                <CheckCircle2 size={14} />
                <span>Reported on {new Date(defect.reportedAt).toLocaleDateString()} by {defect.reportedBy}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber-700)' }}>
                <Layers size={14} />
                <span>Ingested & Classified by XGBoost AI Model (Priority {defect.priorityScore})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--rail-eng)' }}>
                <Clock size={14} />
                <span>Scheduled in Block Plan BLK-2026-WK13</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AIScoreExplainer defect={defect} />

          <div className="warm-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
              Scheduled Maintenance Block
            </h3>
            <div style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--amber-300)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12, display: 'block' }}>BLK-2026-0331-01 (Combined)</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Included with 2 adjacent tasks</span>
              </div>
              <button onClick={() => setCurrentRoute('/block-plans')} className="btn-amber" style={{ fontSize: 12, padding: '6px 12px' }}>
                View in Gantt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
