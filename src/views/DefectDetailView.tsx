import React from 'react';
import { useStore } from '../lib/store/useStore';
import { AIScoreExplainer } from '../components/defects/AIScoreExplainer';
import { ArrowLeft, Clock, CheckCircle2, Layers } from 'lucide-react';

export const DefectDetailView: React.FC = () => {
  const { defects, plans, selectedDefectId, setCurrentRoute } = useStore();
  const defect = defects.find((d) => d.id === selectedDefectId) || defects[0];

  if (!defect) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No defect selected or defects not loaded yet.</p>
        <button
          onClick={() => setCurrentRoute('/defects')}
          className="btn-amber"
          style={{ marginTop: 16, fontSize: 13 }}
        >
          Back to Defect Queue
        </button>
      </div>
    );
  }

  // Compute days overdue from due_date
  const daysOverdue = defect.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(defect.due_date).getTime()) / 86400000))
    : 0;

  // Find the block from plans that contains this defect's ID
  const matchingBlock = plans.flatMap((p) => p.blocks).find((b) => b.defect_ids.includes(defect.id));
  const matchingPlan = matchingBlock ? plans.find((p) => p.id === matchingBlock.plan_id) : null;

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
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{defect.source_system} Database Feed</span>
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
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginTop: 2 }}>{defect.defect_type}</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0, lineHeight: 1.5 }}>{defect.description || 'No description provided'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>LOCATION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{defect.section} (KM {defect.km_from}{defect.km_to ? ` - ${defect.km_to}` : ''})</span>
              </div>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>TSR SPEED RESTRICTION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: defect.requires_tsr ? 'var(--rail-critical)' : 'var(--text-muted)' }}>
                  {defect.requires_tsr ? 'IMPOSED (30 KM/H)' : 'NONE'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>REPORTED BY</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{defect.reported_by || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>ESTIMATED BLOCK DURATION</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-700)' }}>{Math.round(defect.estimated_duration_hrs * 60)} minutes</span>
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
                <span>Reported on {new Date(defect.reported_date).toLocaleDateString()} by {defect.reported_by || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber-700)' }}>
                <Layers size={14} />
                <span>Ingested & Classified by XGBoost AI Model (Priority {defect.priority_score})</span>
              </div>
              {matchingBlock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--rail-eng)' }}>
                  <Clock size={14} />
                  <span>Scheduled in Block Plan {matchingPlan?.name || matchingBlock.plan_id}</span>
                </div>
              )}
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
            {matchingBlock ? (
              <div style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--amber-300)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12, display: 'block' }}>
                    {matchingBlock.id} {matchingBlock.is_combined ? '(Combined)' : ''}
                  </span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Included with {matchingBlock.defect_ids.length - 1} adjacent task{matchingBlock.defect_ids.length - 1 !== 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={() => setCurrentRoute('/block-plans')} className="btn-amber" style={{ fontSize: 12, padding: '6px 12px' }}>
                  View in Gantt
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--text-muted)' }}>
                Not yet scheduled in any block plan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
