import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { CheckCircle2, XCircle, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export const PlanDetailView: React.FC = () => {
  const { plans, selectedPlanId, currentUser, approvePlan, setCurrentRoute } = useStore();
  const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'BLOCKS' | 'AUDIT'>('APPROVALS');
  const [approvalNote, setApprovalNote] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!plan) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No plan selected. Generate a plan first.</p>
        <button onClick={() => setCurrentRoute('/block-plans/generate')} className="btn-amber" style={{ marginTop: 12 }}>
          Generate Plan
        </button>
      </div>
    );
  }

  const canApprove = currentUser?.role === 'DIVISIONAL_BLOCK_PLANNER' || currentUser?.role === 'SENIOR_OFFICER';

  const handleApprove = async () => {
    try {
      await approvePlan(plan.id, 'APPROVE', approvalNote || 'Plan approved after multi-department review.');
      setToastMsg('Plan approved — synced to COA (Control Office Application) successfully!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      setToastMsg(`Error: ${e.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleReject = async () => {
    try {
      await approvePlan(plan.id, 'REJECT', approvalNote || 'Plan rejected — needs re-optimization.');
      setToastMsg('Plan rejected — returned to Divisional Planner for re-optimization.');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      setToastMsg(`Error: ${e.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const deptColor = (d: string) => d === 'ENG' ? 'var(--rail-eng)' : d === 'S&T' ? 'var(--rail-snt)' : 'var(--rail-td)';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toastMsg && (
        <div style={{
          background: toastMsg.startsWith('Error') ? '#FEF2F2' : 'var(--sage-bg)',
          border: `2px solid ${toastMsg.startsWith('Error') ? '#FECACA' : 'var(--sage-border)'}`,
          color: toastMsg.startsWith('Error') ? '#DC2626' : 'var(--sage-text)',
          padding: '12px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color={toastMsg.startsWith('Error') ? '#DC2626' : 'var(--rail-snt)'} />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}>✕</button>
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
            Block Plan Detail & Approval Workflow — {plan.name}
          </h2>
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {plan.plan_type} · {plan.division} · Generated: {new Date(plan.created_at).toLocaleString()}
            {plan.solver_time_ms != null && ` · Solve: ${(plan.solver_time_ms / 1000).toFixed(1)}s`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'APPROVALS', label: 'Multi-Tier Approval Chain' },
            { id: 'BLOCKS', label: `Scheduled Blocks (${plan.blocks.length})` },
            { id: 'AUDIT', label: 'Audit Trail & Overrides' },
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
              {/* Real approvals from API */}
              {plan.approvals.length > 0 ? plan.approvals.map((appr) => (
                <div key={appr.id} style={{
                  background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12,
                  border: `1px solid ${appr.action === 'APPROVE' ? 'var(--sage-border)' : '#FECACA'}`,
                  borderLeft: `4px solid ${appr.action === 'APPROVE' ? 'var(--rail-snt)' : '#DC2626'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: appr.action === 'APPROVE' ? 'var(--sage-bg)' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {appr.action === 'APPROVE' ? <UserCheck size={18} color="var(--rail-snt)" /> : <XCircle size={18} color="#DC2626" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{appr.user_name} ({appr.role})</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {appr.comment || 'No comment'} · {new Date(appr.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className={`chip ${appr.action === 'APPROVE' ? 'chip-sage' : 'chip-red'}`}>{appr.action}</span>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No approvals yet. Waiting for officer review.
                </div>
              )}

              {/* Pending stages */}
              {plan.status !== 'APPROVED' && (
                <div style={{
                  background: 'var(--bg-raised)', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--amber-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--amber-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={18} color="var(--amber-700)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Next: Officer Approval Required</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Divisional Block Planner or Senior Officer must review</div>
                    </div>
                  </div>
                  <span className="chip chip-amber">PENDING</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Box */}
          {plan.status !== 'APPROVED' && (
            <div className="warm-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--amber-700)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber-700)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} />
                <span>Officer Approval Decision — Signed in as {currentUser?.name} ({currentUser?.role})</span>
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
                  Your current role ({currentUser?.role}) has read-only review rights. Use the persona switcher in the top bar to switch to a Divisional Planner or Senior Officer role to approve.
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
                {['BLOCK ID', 'TYPE', 'SECTION', 'DEPT', 'DEFECTS', 'DURATION', 'CONFIDENCE', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', background: 'var(--bg-raised)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.blocks.map((blk) => (
                <tr key={blk.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>{blk.id}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`chip ${blk.is_combined ? 'chip-amber' : 'chip-muted'}`} style={{ fontSize: 10 }}>
                      {blk.is_combined ? 'COMBINED' : blk.block_type}
                    </span>
                  </td>
                  <td className="font-mono" style={{ padding: '12px 14px', fontSize: 12 }}>{blk.section}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="chip" style={{ fontSize: 10, background: deptColor(blk.department), color: '#fff', border: 'none' }}>
                      {blk.department}
                    </span>
                    {blk.is_combined && blk.combined_departments && (
                      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                        +{blk.combined_departments.filter(d => d !== blk.department).join(',')}
                      </span>
                    )}
                  </td>
                  <td className="font-mono" style={{ padding: '12px 14px', fontSize: 12 }}>{blk.defect_ids.length}</td>
                  <td className="font-mono" style={{ padding: '12px 14px', fontSize: 12 }}>{blk.duration_hrs}h</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-snt)', fontSize: 12 }}>
                      {(blk.ai_confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`chip ${blk.status === 'COMPLETED' ? 'chip-sage' : blk.status === 'IN_PROGRESS' ? 'chip-amber' : 'chip-muted'}`} style={{ fontSize: 10 }}>
                      {blk.status}
                    </span>
                  </td>
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

          {/* Overridden blocks */}
          {plan.blocks.filter(b => b.override_reason).map((blk) => (
            <div key={blk.id} style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-soft)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>OVERRIDE — Block {blk.id}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>By: {blk.overridden_by || 'Unknown'}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{blk.override_reason}</p>
            </div>
          ))}

          {/* Approval logs */}
          {plan.approvals.map((appr) => (
            <div key={appr.id} style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-soft)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)', fontSize: 12 }}>
                  {appr.action} — {appr.user_name} ({appr.role})
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(appr.created_at).toLocaleString()}</span>
              </div>
              {appr.comment && <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{appr.comment}</p>}
            </div>
          ))}

          {plan.blocks.filter(b => b.override_reason).length === 0 && plan.approvals.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No audit entries yet. Overrides and approvals will appear here.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
