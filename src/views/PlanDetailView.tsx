import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { CheckCircle2, XCircle, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export const PlanDetailView: React.FC = () => {
  const { plans, selectedPlanId, currentUser, approvePlan, setCurrentRoute } = useStore();
  const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'BLOCKS' | 'AUDIT'>('APPROVALS');
  const [approvalNote, setApprovalNote] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canApprove = currentUser.role === 'DIVISIONAL_BLOCK_PLANNER' || currentUser.role === 'SENIOR_OFFICER';

  const handleApprove = () => {
    approvePlan(plan.id, currentUser.role, currentUser.name, approvalNote || 'Plan approved after multi-department review.');
    setToastMsg('Plan approved — synced to COA (Control Office Application) successfully!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleReject = () => {
    setToastMsg('Plan rejected — returned to Divisional Planner for re-optimization.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div style={{
          background: 'var(--sage-bg)', border: '2px solid var(--sage-border)',
          color: 'var(--sage-text)', padding: '12px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="var(--rail-snt)" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--sage-text)' }}>✕</button>
        </div>
      )}

      {/* Plan Header */}
      <div className="warm-card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentRoute('/block-plans')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--rail-eng)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Gantt View</span>
          </button>
          <span className={`chip ${plan.status === 'APPROVED' ? 'chip-sage' : 'chip-amber'}`} style={{ fontSize: 11 }}>
            STATUS: {plan.status}
          </span>
        </div>

        <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Block Plan Detail & Approval Workflow — {plan.id}
          </h2>
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Section: {plan.sectionId} · Generated: {new Date(plan.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'APPROVALS', label: 'Multi-Tier Approval Chain' },
            { id: 'BLOCKS',    label: `Scheduled Blocks (${plan.blocks.length})` },
            { id: 'AUDIT',     label: 'Audit Trail & Overrides' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab.id ? 'var(--amber-700)' : 'var(--bg-raised)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                borderColor: activeTab === tab.id ? 'var(--amber-700)' : 'var(--border-soft)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Approval Chain */}
      {activeTab === 'APPROVALS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="warm-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              Visible Approval Chain Stages
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Step 1: SSE Review */}
              <div style={{ background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sage-border)', borderLeft: '4px solid var(--rail-snt)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sage-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={18} color="var(--rail-snt)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Stage 1: Senior Section Engineer (SSE) Technical Review</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vikram Singh (SSE Engineering, Kalyan)</div>
                  </div>
                </div>
                <span className="chip chip-sage">APPROVED</span>
              </div>

              {/* Step 2: Divisional Planner */}
              <div style={{ background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--amber-700)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--amber-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color="var(--amber-700)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Stage 2: Divisional Block Planning Officer Approval</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rajesh Sharma (Divisional Block Planning Officer)</div>
                  </div>
                </div>
                {plan.approvals.some((a) => a.role === 'DIVISIONAL_BLOCK_PLANNER')
                  ? <span className="chip chip-sage">APPROVED</span>
                  : <span className="chip chip-amber">PENDING</span>
                }
              </div>

              {/* Step 3: DRM Senior Officer */}
              <div style={{ background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--rail-eng)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(29,78,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={18} color="var(--rail-eng)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Stage 3: Divisional Railway Manager (DRM) Final Approval</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Anil Deshmukh (DRM, Mumbai Division)</div>
                  </div>
                </div>
                {plan.status === 'APPROVED'
                  ? <span className="chip chip-sage">FINAL APPROVED</span>
                  : <span className="chip chip-amber">AWAITING DRM SIGN-OFF</span>
                }
              </div>
            </div>
          </div>

          {/* Action Box */}
          {plan.status !== 'APPROVED' && (
            <div className="warm-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--amber-700)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber-700)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} />
                <span>Officer Approval Decision — Signed in as {currentUser.name} ({currentUser.designation})</span>
              </div>

              {canApprove ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Optional approval note or condition (e.g. Approved for midnight window)..."
                    className="warm-input font-mono"
                    style={{ resize: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleApprove} className="btn-amber" style={{ fontSize: 13 }}>
                      <CheckCircle2 size={16} />
                      Approve & Sync to COA
                    </button>
                    <button onClick={handleReject} className="btn-ghost" style={{ fontSize: 13, borderColor: 'var(--rail-critical)', color: 'var(--rail-critical)' }}>
                      <XCircle size={16} />
                      Reject Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--amber-100)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--amber-300)', fontSize: 12, color: 'var(--amber-900)' }}>
                  Your current persona ({currentUser.role}) has read-only review rights. Switch persona to <strong>Rajesh Sharma (Planner)</strong> or <strong>Anil Deshmukh (DRM)</strong> in top-right switcher to approve.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Blocks */}
      {activeTab === 'BLOCKS' && (
        <div className="warm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="warm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['BLOCK ID', 'TYPE', 'SECTION', 'DEPARTMENTS', 'CONFIDENCE', 'UTILISATION'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.blocks.map((blk) => (
                <tr key={blk.id}>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)' }}>{blk.id}</td>
                  <td>
                    <span className={`chip ${blk.blockType === 'COMBINED' ? 'chip-amber' : 'chip-blue'}`}>
                      {blk.blockType}
                    </span>
                  </td>
                  <td className="font-mono">{blk.blockSection}</td>
                  <td className="font-mono">{blk.departments.join(', ')}</td>
                  <td className="font-mono">{(blk.aiConfidence * 100).toFixed(0)}%</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-snt)' }}>{blk.utilisationPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
            Plan Audit & Override Logs
          </h3>
          {plan.blocks.filter(b => b.manuallyOverridden).map((blk) => (
            <div key={blk.id} style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-soft)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>OVERRIDE LOG — Block {blk.id}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Audit Entry #8491</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{blk.overrideReason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
