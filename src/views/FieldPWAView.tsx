import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../lib/store/useStore';
import { ApiBlock } from '../lib/api';
import { ProgressBar } from '../components/execution/BlockLifecycle';
import {
  Smartphone, CheckCircle2, PlusCircle, Play, PauseCircle, GitBranch, X,
  Lock, ShieldCheck,
} from 'lucide-react';

export const FieldPWAView: React.FC = () => {
  const {
    currentUser, defects, plans, live, setCurrentRoute,
    fetchLive, startBlock, reportProgress, partialComplete, completeBlock, approvePlan,
  } = useStore();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TASKS'>('TODAY');
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);
  const [partialForBlockId, setPartialForBlockId] = useState<string | null>(null);
  const [partialReason, setPartialReason] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // The field device needs the live execution feed to know real block state.
  useEffect(() => { void fetchLive(); }, [fetchLive]);

  // Get today's date string for comparison
  const todayStr = new Date().toISOString().slice(0, 10);

  // Find user's assigned sections
  const userSections = currentUser?.assigned_sections || [];

  // Find today's blocks from plans, filtered by user's sections
  const todaysBlocks = useMemo(() => {
    const blocks: (ApiBlock & { planId: string })[] = [];
    for (const plan of plans) {
      for (const block of plan.blocks) {
        const blockDate = block.scheduled_start?.slice(0, 10);
        const inSection = userSections.length === 0 || userSections.includes(block.section);
        if (blockDate === todayStr && inSection) {
          blocks.push({ ...block, planId: plan.id });
        }
      }
    }
    // If no blocks today, show upcoming blocks for user's sections
    if (blocks.length === 0) {
      for (const plan of plans) {
        for (const block of plan.blocks) {
          const inSection = userSections.length === 0 || userSections.includes(block.section);
          if (inSection && block.status !== 'COMPLETED') {
            blocks.push({ ...block, planId: plan.id });
          }
        }
      }
    }
    return blocks.slice(0, 5);
  }, [plans, userSections, todayStr]);

  // Filter defects by user's section
  const myTasks = useMemo(() => {
    if (userSections.length > 0) {
      return defects.filter((d) => userSections.includes(d.section)).slice(0, 6);
    }
    return defects.slice(0, 6);
  }, [defects, userSections]);

  const run = async (blockId: string, fn: () => Promise<void>) => {
    setUpdatingBlockId(blockId);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setUpdatingBlockId(null);
    }
  };

  // Roles the backend accepts as approvers for a block plan.
  const canApprovePlans = ['SUPER_ADMIN', 'SENIOR_OFFICER', 'DIVISIONAL_BLOCK_PLANNER']
    .includes(currentUser?.role ?? '');

  const handleStartBlock = (block: ApiBlock) =>
    run(block.id, async () => {
      await startBlock(block.id, currentUser?.name);
      setNotice({ kind: 'ok', text: `Disconnection taken — ${block.id} is live on ${block.section}.` });
    });

  const handleApprovePlan = (block: ApiBlock, planId: string) =>
    run(block.id, async () => {
      const res = await approvePlan(
        planId, 'APPROVE',
        `Approved from the field to release ${block.id} for execution.`,
      );
      await fetchLive();

      // A single approval does not always finalise the plan — the chain may need
      // a second signature. Report the status the backend actually returned.
      if (res.status === 'APPROVED' || res.status === 'IN_EXECUTION') {
        setNotice({ kind: 'ok', text: `Plan ${planId} approved — blocks on it can now be started.` });
      } else {
        setNotice({
          kind: 'err',
          text:
            `Your approval was recorded, but plan ${planId} is still ${res.status.replace(/_/g, ' ')} — ` +
            `the approval chain needs a Senior Officer or DRM signature before work can begin.`,
        });
      }
    });

  const handleToggleTask = (block: ApiBlock, defectId: string) => {
    const done = new Set(block.completed_defect_ids || []);
    if (done.has(defectId)) done.delete(defectId); else done.add(defectId);
    return run(block.id, () => reportProgress(block.id, [...done]).then(() => undefined));
  };

  const handleCompleteBlock = (block: ApiBlock) =>
    run(block.id, async () => {
      await completeBlock(block.id, 'Field crew: all tasks complete, line restored.');
      setNotice({ kind: 'ok', text: `${block.id} completed — line cleared and restoration logged.` });
    });

  const handlePartialComplete = (block: ApiBlock) =>
    run(block.id, async () => {
      const res = await partialComplete(
        block.id,
        block.completed_defect_ids || [],
        partialReason.trim() || 'Window expired with work outstanding.',
      );
      setPartialForBlockId(null);
      setPartialReason('');

      if (res.carry_forward) {
        const cf = res.carry_forward;
        setNotice({
          kind: 'ok',
          text:
            `Line handed back. AI rescheduled ${cf.defect_ids.length} outstanding task(s) to ` +
            `${cf.id} on ${new Date(cf.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
        });
      } else if (res.escalation) {
        setNotice({ kind: 'err', text: `Escalated to the Divisional Planner — ${res.escalation.message}` });
      }
    });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // `reportProgress` only refreshes the live feed, so prefer that copy of a
  // block when it exists — otherwise a ticked task would not show up until the
  // next full plan refresh.
  const liveById = useMemo(() => {
    const map = new Map<string, ApiBlock>();
    if (!live) return map;
    [...live.active_blocks, ...live.partial_blocks, ...live.upcoming_blocks, ...live.recent_completions]
      .forEach(b => map.set(b.id, b));
    return map;
  }, [live]);

  const freshest = (block: ApiBlock): ApiBlock => liveById.get(block.id) ?? block;

  const tabs = [
    { id: 'TODAY', label: 'Today' },
    { id: 'TASKS', label: 'My Tasks' },
  ] as const;

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="warm-card" style={{ padding: 0, overflow: 'hidden', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div style={{ background: 'var(--amber-900)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} color="#FCD34D" />
            <div>
              <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>RailSync FIELD PWA</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{currentUser?.name || 'Field User'} ({currentUser?.role || 'N/A'})</div>
            </div>
          </div>
          <span className="chip font-mono" style={{
            fontSize: 10, fontWeight: 700,
            background: 'var(--rail-snt)',
            color: '#fff', border: 'none',
          }}>
            ONLINE
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notice && (
            <div style={{
              background: notice.kind === 'ok' ? 'var(--sage-bg)' : '#FEF2F2',
              border: `1px solid ${notice.kind === 'ok' ? 'var(--sage-border)' : '#FECACA'}`,
              color: notice.kind === 'ok' ? 'var(--sage-text)' : '#B91C1C',
              borderRadius: 10, padding: '10px 12px', fontSize: 11.5, fontWeight: 600,
              display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5,
            }}>
              {notice.kind === 'ok'
                ? <GitBranch size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                : <X size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span style={{ flex: 1 }}>{notice.text}</span>
              <button
                onClick={() => setNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <button
            onClick={() => setCurrentRoute('/defects/new')}
            className="btn-amber"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          >
            <PlusCircle size={16} />
            Quick Report Defect (GPS + QR)
          </button>

          {activeTab === 'TODAY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                {todaysBlocks.length > 0
                  ? `Today's Scheduled Blocks (${userSections[0] || 'All Sections'})`
                  : 'Upcoming Blocks'}
              </h3>
              {todaysBlocks.length === 0 && (
                <div className="warm-card" style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-muted)' }}>
                  No blocks scheduled for today in your assigned sections.
                </div>
              )}
              {todaysBlocks.map((planBlock) => {
                const block = freshest(planBlock);
                const busy = updatingBlockId === block.id;
                const total = (block.defect_ids || []).length;
                const doneIds = new Set(block.completed_defect_ids || []);
                const doneCount = doneIds.size;
                const allDone = total > 0 && doneCount === total;
                const isLive = block.status === 'IN_PROGRESS';
                const isTerminal = block.status === 'COMPLETED' || block.status === 'PARTIALLY_DONE';
                // Only a not-yet-started block on an unapproved plan is gated.
                const awaitingApproval = !isLive && !isTerminal && !block.is_startable;
                const accent =
                  block.status === 'COMPLETED' ? 'var(--rail-snt)'
                    : block.status === 'PARTIALLY_DONE' ? 'var(--rail-td)'
                      : 'var(--amber-700)';

                return (
                <div key={block.id} className="warm-card" style={{ padding: '16px 18px', borderLeft: `4px solid ${accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                    <div>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13, display: 'block' }}>{block.id}</span>
                      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{block.section} · {block.department}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {block.is_combined && (
                        <span className="chip chip-amber" style={{ fontSize: 10 }}>COMBINED BLOCK</span>
                      )}
                      {block.carry_forward_generation > 0 && (
                        <span className="chip chip-amber" style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <GitBranch size={9} /> CARRY-FWD
                        </span>
                      )}
                      {awaitingApproval && (
                        <span className="chip chip-muted" style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Lock size={9} /> AWAITING APPROVAL
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12 }}>
                    <div className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      Time Window: <strong>{formatTime(block.scheduled_start)} – {formatTime(block.scheduled_end)} ({block.duration_hrs}h)</strong>
                    </div>
                    {block.is_combined && block.combined_departments && (
                      <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                        Departments: <strong>{block.combined_departments.join(' + ')}</strong>
                      </div>
                    )}
                    <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                      Defects: <strong>{doneCount}/{total} task{total !== 1 ? 's' : ''} complete</strong>
                    </div>
                  </div>

                  {/* Progress + task checklist, once the block is live */}
                  {(isLive || block.status === 'PARTIALLY_DONE') && total > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ marginBottom: 8 }}>
                        <ProgressBar
                          pct={total ? (doneCount / total) * 100 : 0}
                          color={block.status === 'PARTIALLY_DONE' ? 'var(--rail-td)' : 'var(--amber-700)'}
                          showLabel
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(block.defect_ids || []).map((defectId) => {
                          // Prefer the block's own task payload — the defect queue is
                          // department-scoped and would hide a combined block's other half.
                          const d = live?.tasks?.[defectId] ?? defects.find(x => x.id === defectId);
                          const isDone = doneIds.has(defectId);
                          return (
                            <label
                              key={defectId}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 9,
                                background: isDone ? 'var(--sage-bg)' : 'var(--bg-raised)',
                                border: `1px solid ${isDone ? 'var(--sage-border)' : 'var(--border-soft)'}`,
                                borderRadius: 8, padding: '9px 11px',
                                cursor: isLive && !busy ? 'pointer' : 'default',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                disabled={!isLive || busy}
                                onChange={() => void handleToggleTask(block, defectId)}
                                style={{ width: 17, height: 17, accentColor: 'var(--rail-snt)', cursor: 'inherit', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="font-mono" style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: isDone ? 'var(--sage-text)' : 'var(--amber-700)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}>
                                  {defectId}
                                </div>
                                <div style={{
                                  fontSize: 11, color: 'var(--text-secondary)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}>
                                  {d
                                    ? `${d.defect_type} · km ${d.km_from} · ${d.department}`
                                    : 'Task detail unavailable'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Partial handback reason capture */}
                  {partialForBlockId === block.id && (
                    <div style={{
                      background: '#FFF7ED', border: '1px solid #FED7AA',
                      borderRadius: 10, padding: '12px 13px', marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                        <GitBranch size={13} color="var(--rail-td)" />
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--rail-td)' }}>
                          {total - doneCount} task(s) will be auto-rescheduled
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 9px', lineHeight: 1.5 }}>
                        Hand the line back now. The AI books the outstanding work into the
                        next-best window on {block.section} — nothing drops off the plan.
                      </p>
                      <textarea
                        rows={2}
                        value={partialReason}
                        onChange={(e) => setPartialReason(e.target.value)}
                        placeholder="Why is work outstanding? (e.g. late-running train ate the window)"
                        className="warm-input font-mono"
                        style={{ resize: 'none', marginBottom: 9, fontSize: 12 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => { setPartialForBlockId(null); setPartialReason(''); }}
                          className="btn-ghost"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void handlePartialComplete(block)}
                          disabled={busy}
                          className="btn-amber"
                          style={{ flex: 2, justifyContent: 'center', fontSize: 12, background: 'var(--rail-td)', opacity: busy ? 0.6 : 1 }}
                        >
                          <PauseCircle size={14} />
                          {busy ? 'Re-optimising…' : 'Hand Back & Reschedule'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lifecycle actions */}
                  {block.status === 'COMPLETED' ? (
                    <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--rail-snt)', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Block Completed · Line Restored
                    </div>
                  ) : block.status === 'PARTIALLY_DONE' ? (
                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--rail-td)', padding: '8px 0', lineHeight: 1.5 }}>
                      <PauseCircle size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                      Handed back partially done
                      {block.carried_forward_to && (
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
                          Outstanding work moved to {block.carried_forward_to}
                        </div>
                      )}
                    </div>
                  ) : isLive ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => void handleCompleteBlock(block)}
                        disabled={busy || !allDone}
                        className="btn-ghost"
                        style={{
                          width: '100%', justifyContent: 'center', fontSize: 13,
                          borderColor: allDone ? 'var(--rail-snt)' : 'var(--border-mid)',
                          color: allDone ? 'var(--rail-snt)' : 'var(--text-muted)',
                          cursor: allDone ? 'pointer' : 'not-allowed',
                          opacity: busy ? 0.6 : 1,
                        }}
                        title={allDone ? 'Hand the line back, all work complete' : 'Tick every task first, or hand back partially'}
                      >
                        <CheckCircle2 size={15} /> Complete Block & Log Restoration
                      </button>

                      <button
                        onClick={() => setPartialForBlockId(block.id)}
                        disabled={busy || allDone || partialForBlockId === block.id}
                        className="btn-ghost"
                        style={{
                          width: '100%', justifyContent: 'center', fontSize: 13,
                          borderColor: 'var(--rail-td)', color: 'var(--rail-td)',
                          cursor: allDone ? 'not-allowed' : 'pointer',
                          opacity: allDone || busy ? 0.45 : 1,
                        }}
                        title={allDone ? 'Nothing outstanding — complete the block instead' : 'Hand back with work outstanding'}
                      >
                        <PauseCircle size={15} /> Mark Partially Done
                      </button>

                      {!allDone && (
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                          {total - doneCount} task(s) outstanding — finish them all, or hand back
                          partially and let the AI reschedule the rest.
                        </span>
                      )}
                    </div>
                  ) : !awaitingApproval ? (
                    <button
                      onClick={() => void handleStartBlock(block)}
                      disabled={busy}
                      className="btn-amber"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 13, opacity: busy ? 0.6 : 1 }}
                    >
                      <Play size={14} /> {busy ? 'Taking disconnection…' : 'Start Maintenance Block Work'}
                    </button>
                  ) : (
                    /* Governance gate: the parent plan has not been approved yet, so
                       show why the block cannot start instead of failing on click. */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{
                        background: 'var(--amber-100)', border: '1px solid var(--amber-300)',
                        borderRadius: 9, padding: '10px 12px',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <Lock size={13} color="var(--amber-900)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div style={{ fontSize: 11, color: 'var(--amber-900)', lineHeight: 1.5 }}>
                          <strong>Awaiting plan approval.</strong> A disconnection cannot be taken
                          until <span className="font-mono">{planBlock.planId}</span> is signed off
                          {block.plan_status ? ` (currently ${block.plan_status.replace(/_/g, ' ')})` : ''}.
                        </div>
                      </div>

                      {canApprovePlans ? (
                        <button
                          onClick={() => void handleApprovePlan(block, planBlock.planId)}
                          disabled={busy}
                          className="btn-ghost"
                          style={{
                            width: '100%', justifyContent: 'center', fontSize: 12,
                            borderColor: 'var(--rail-snt)', color: 'var(--rail-snt)',
                            opacity: busy ? 0.6 : 1,
                          }}
                        >
                          <ShieldCheck size={14} />
                          {busy ? 'Approving…' : 'Approve Plan & Release for Work'}
                        </button>
                      ) : (
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                          Your role cannot approve plans — ask the Divisional Planner or DRM.
                        </span>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}

          {activeTab === 'TASKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                My Assigned Defects ({myTasks.length})
              </h3>
              {myTasks.map((t) => (
                <div key={t.id} className="warm-card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)', fontSize: 12 }}>{t.id}</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>KM {t.km_from}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{t.defect_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description || t.asset_type || 'No description'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '10px 18px', display: 'flex', justifyContent: 'space-around', background: 'var(--bg-surface)' }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === id ? 'var(--amber-100)' : 'transparent',
                color: activeTab === id ? 'var(--amber-700)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
