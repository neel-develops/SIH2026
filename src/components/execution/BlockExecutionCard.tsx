import React, { useState, useEffect, useMemo } from 'react';
import type { ApiBlock, ApiDefect, BlockTask } from '../../lib/api';
import { LifecycleTracker, ProgressBar, STATUS_CHIP, fmtHrs } from './BlockLifecycle';
import {
  Play, CheckCircle2, PauseCircle, Clock, AlertTriangle, MapPin,
  Users, ChevronDown, ChevronRight, GitBranch, Sparkles, History, Lock,
} from 'lucide-react';

interface Props {
  block: ApiBlock;
  defects: ApiDefect[];
  /** Task details supplied by the live feed, keyed by defect id. */
  tasks?: Record<string, BlockTask>;
  serverTime: string;
  canOperate: boolean;
  onStart: (blockId: string, teamLeader: string) => Promise<void>;
  onProgress: (blockId: string, completed: string[]) => Promise<void>;
  onPartial: (blockId: string, completed: string[], reason: string) => Promise<void>;
  onComplete: (blockId: string, remarks: string) => Promise<void>;
  defaultExpanded?: boolean;
}

const deptColor = (d: string) =>
  d === 'ENG' ? 'var(--rail-eng)'
    : d === 'S&T' ? 'var(--rail-snt)'
      : d === 'TD' ? 'var(--rail-td)'
        : 'var(--amber-700)';

/**
 * Drives one block through its lifecycle:
 *   SCHEDULED → [Start Block] → IN_PROGRESS → [Partial | Complete]
 *
 * While a block is live the elapsed timer ticks locally against the actual start
 * timestamp, so the control room reads as a real operations screen rather than a
 * table that only changes on refresh.
 */
export const BlockExecutionCard: React.FC<Props> = ({
  block, defects, tasks, canOperate,
  onStart, onProgress, onPartial, onComplete,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [checked, setChecked] = useState<Set<string>>(new Set(block.completed_defect_ids || []));
  const [tick, setTick] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialReason, setPartialReason] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [showLog, setShowLog] = useState(false);

  const isLive = block.status === 'IN_PROGRESS';

  // Keep the local checklist in sync when the block is refetched.
  useEffect(() => {
    setChecked(new Set(block.completed_defect_ids || []));
  }, [block.completed_defect_ids]);

  // Tick the elapsed clock once a second, but only for a live block.
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  // Prefer the live feed's task payload: the defect queue is department-scoped,
  // so a combined block's cross-department tasks are missing from `defects`.
  const blockDefects = useMemo(
    () => (block.defect_ids || []).map(
      id => tasks?.[id] ?? defects.find(d => d.id === id) ?? null,
    ),
    [block.defect_ids, defects, tasks],
  );

  const elapsedHrs = useMemo(() => {
    if (!block.actual_start) return 0;
    const end = block.actual_end ? new Date(block.actual_end).getTime() : tick;
    return Math.max(0, (end - new Date(block.actual_start).getTime()) / 3600000);
  }, [block.actual_start, block.actual_end, tick]);

  const planned = block.duration_hrs || 1;
  const burnPct = (elapsedHrs / planned) * 100;
  const isOverrun = elapsedHrs > planned;
  const remainingHrs = Math.max(0, planned - elapsedHrs);

  const total = (block.defect_ids || []).length;
  const doneCount = checked.size;
  const workPct = total ? (doneCount / total) * 100 : 0;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleDefect = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChecked(next);
    void run('progress', () => onProgress(block.id, [...next]));
  };

  const statusAccent =
    block.status === 'COMPLETED' ? 'var(--rail-snt)'
      : block.status === 'PARTIALLY_DONE' ? 'var(--rail-td)'
        : isOverrun && isLive ? 'var(--rail-critical)'
          : isLive ? 'var(--amber-700)'
            : 'var(--border-mid)';

  return (
    <div
      className="warm-card"
      style={{
        padding: 0, overflow: 'hidden',
        borderLeft: `4px solid ${statusAccent}`,
        boxShadow: isLive ? '0 2px 18px rgba(180,83,9,0.14)' : undefined,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}
      >
        {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {isLive && (
            <span className="pulse-amber" style={{
              width: 9, height: 9, borderRadius: '50%',
              background: isOverrun ? 'var(--rail-critical)' : 'var(--amber-500)', flexShrink: 0,
            }} />
          )}
          <span className="font-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--amber-700)' }}>
            {block.id}
          </span>
        </div>

        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} /> {block.section}
        </span>

        <span className="chip" style={{
          fontSize: 10, background: deptColor(block.department), color: '#fff', border: 'none',
        }}>
          {block.is_combined ? (block.combined_departments || []).join(' + ') : block.department}
        </span>

        {block.carry_forward_generation > 0 && (
          <span className="chip chip-amber" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <GitBranch size={10} /> CARRY-FWD GEN {block.carry_forward_generation}
          </span>
        )}

        <span className={`chip ${STATUS_CHIP[block.status] ?? 'chip-muted'}`} style={{ fontSize: 10 }}>
          {block.status.replace(/_/g, ' ')}
        </span>

        {(block.status === 'SCHEDULED' || block.status === 'OVERRIDDEN') && !block.is_startable && (
          <span className="chip chip-muted" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={10} /> AWAITING APPROVAL
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {isLive && (
            <span className="font-mono" style={{
              fontSize: 13, fontWeight: 700,
              color: isOverrun ? 'var(--rail-critical)' : 'var(--amber-700)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Clock size={13} />
              {fmtHrs(elapsedHrs)} / {fmtHrs(planned)}
              {isOverrun && <span> · +{fmtHrs(elapsedHrs - planned)} OVER</span>}
            </span>
          )}
          <div style={{ width: 130 }}>
            <ProgressBar
              pct={workPct}
              color={block.status === 'COMPLETED' ? 'var(--rail-snt)' : isOverrun ? 'var(--rail-critical)' : 'var(--amber-700)'}
              showLabel
            />
          </div>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 52 }}>
            {doneCount}/{total} tasks
          </span>
        </div>
      </div>

      {/* Time-burn bar — shows window consumption vs work delivered */}
      {isLive && (
        <div style={{ padding: '0 18px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 76 }}>
              WINDOW BURN
            </span>
            <ProgressBar
              pct={burnPct}
              height={6}
              color={isOverrun ? 'var(--rail-critical)' : burnPct > 80 ? 'var(--amber-500)' : 'var(--rail-eng)'}
            />
            <span className="font-mono" style={{
              fontSize: 10, fontWeight: 700, minWidth: 92, textAlign: 'right',
              color: isOverrun ? 'var(--rail-critical)' : 'var(--text-secondary)',
            }}>
              {isOverrun ? 'WINDOW EXPIRED' : `${fmtHrs(remainingHrs)} left`}
            </span>
          </div>
          {burnPct > 70 && workPct < burnPct - 20 && (
            <div style={{
              marginTop: 8, padding: '7px 11px', borderRadius: 8,
              background: '#FEF2F2', border: '1px solid #FECACA',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <AlertTriangle size={13} color="var(--rail-critical)" />
              <span style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>
                Overrun risk — {burnPct.toFixed(0)}% of the window consumed but only {workPct.toFixed(0)}% of tasks
                complete. Consider a partial handback to protect the following train path.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ padding: '14px 0 12px' }}>
            <LifecycleTracker status={block.status} />
          </div>

          {/* AI rationale */}
          {block.ai_rationale && (
            <div style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
              borderLeft: '3px solid var(--amber-500)', borderRadius: 10,
              padding: '10px 13px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={12} color="var(--amber-700)" />
                <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber-700)' }}>
                  AI SCHEDULING RATIONALE · CONFIDENCE {(block.ai_confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {block.ai_rationale}
              </p>
            </div>
          )}

          {/* Carry-forward links */}
          {(block.carried_forward_from || block.carried_forward_to) && (
            <div style={{
              background: 'var(--amber-100)', border: '1px solid var(--amber-300)',
              borderRadius: 10, padding: '10px 13px', marginBottom: 14,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {block.carried_forward_from && (
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitBranch size={12} /> Carried forward FROM {block.carried_forward_from}
                </span>
              )}
              {block.carried_forward_to && (
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitBranch size={12} /> Outstanding work auto-rescheduled TO {block.carried_forward_to}
                </span>
              )}
            </div>
          )}

          {block.partial_reason && (
            <div style={{
              background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10,
              padding: '10px 13px', marginBottom: 14,
            }}>
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--rail-td)' }}>
                PARTIAL HANDBACK REASON
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>{block.partial_reason}</p>
            </div>
          )}

          {/* Meta strip */}
          <div className="font-mono" style={{
            display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 14,
            fontSize: 11, color: 'var(--text-muted)',
          }}>
            <span>Planned: {new Date(block.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {fmtHrs(planned)}</span>
            {block.actual_start && <span>Started: {new Date(block.actual_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
            {block.actual_duration_hrs != null && <span>Actual: {fmtHrs(block.actual_duration_hrs)}</span>}
            {block.overrun_min > 0 && <span style={{ color: 'var(--rail-critical)', fontWeight: 700 }}>Overrun: {block.overrun_min.toFixed(0)} min</span>}
            {block.team_leader && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={11} />{block.team_leader}</span>}
          </div>

          {/* Task checklist */}
          <div style={{ marginBottom: 14 }}>
            <div className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
              MAINTENANCE TASK CHECKLIST ({doneCount}/{total} COMPLETE)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(block.defect_ids || []).map((id, i) => {
                const d = blockDefects[i];
                const isDone = checked.has(id);
                return (
                  <label
                    key={id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: isDone ? 'var(--sage-bg)' : 'var(--bg-raised)',
                      border: `1px solid ${isDone ? 'var(--sage-border)' : 'var(--border-soft)'}`,
                      borderRadius: 9, padding: '9px 12px',
                      cursor: isLive && canOperate ? 'pointer' : 'default',
                      opacity: isLive || isDone ? 1 : 0.75,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      disabled={!isLive || !canOperate || busy === 'progress'}
                      onChange={() => toggleDefect(id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--rail-snt)', cursor: 'inherit' }}
                    />
                    <span className="font-mono" style={{
                      fontSize: 11, fontWeight: 700, minWidth: 108,
                      color: isDone ? 'var(--sage-text)' : 'var(--amber-700)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {id}
                    </span>
                    <span style={{
                      fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 0,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {d ? `${d.defect_type} · km ${d.km_from}` : 'Task detail unavailable'}
                    </span>
                    {d && (
                      <>
                        <span className="chip" style={{
                          fontSize: 9,
                          background: deptColor(d.department), color: '#fff', border: 'none',
                        }}>
                          {d.department}
                        </span>
                        <span className={`chip ${d.criticality === 'CRITICAL' ? 'chip-red' : 'chip-muted'}`} style={{ fontSize: 9 }}>
                          {d.criticality}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {d.estimated_duration_hrs}h
                        </span>
                      </>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Execution log */}
          {(block.execution_log || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <button
                onClick={() => setShowLog(v => !v)}
                className="font-mono"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <History size={12} />
                EXECUTION AUDIT TRAIL ({block.execution_log.length})
                {showLog ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              {showLog && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {block.execution_log.map((entry, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
                      borderLeft: '3px solid var(--rail-eng)', borderRadius: 8, padding: '8px 11px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--rail-eng)' }}>
                          {entry.event.replace(/_/g, ' ')} · {entry.actor}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(entry.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0' }}>{entry.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9,
              padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#B91C1C', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* ── Lifecycle actions ──────────────────────────────────────── */}
          {!canOperate ? (
            <div className="font-mono" style={{
              background: 'var(--bg-raised)', border: '1px dashed var(--border-mid)',
              borderRadius: 9, padding: '10px 13px', fontSize: 11, color: 'var(--text-muted)',
            }}>
              Your role has view-only access to block execution. Switch to an SSE, Junior Engineer
              or Planner persona to operate this block.
            </div>
          ) : (block.status === 'SCHEDULED' || block.status === 'OVERRIDDEN') && !block.is_startable ? (
            /* Governance gate — surface the blocker instead of failing on click. */
            <div style={{
              background: 'var(--amber-100)', border: '1px solid var(--amber-300)',
              borderRadius: 9, padding: '11px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 9,
            }}>
              <Lock size={14} color="var(--amber-900)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--amber-900)', lineHeight: 1.5 }}>
                <strong>Awaiting plan approval.</strong> A disconnection cannot be taken until plan{' '}
                <span className="font-mono">{block.plan_id}</span> is signed off
                {block.plan_status ? ` (currently ${block.plan_status.replace(/_/g, ' ')})` : ''}.
                Approve it on the Block Plans → Approval Chain screen to release this block for work.
              </div>
            </div>
          ) : block.status === 'SCHEDULED' || block.status === 'OVERRIDDEN' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={teamLeader}
                onChange={(e) => setTeamLeader(e.target.value)}
                placeholder="Team leader on site (optional)"
                className="warm-input font-mono"
                style={{ maxWidth: 250, fontSize: 12 }}
              />
              <button
                onClick={() => run('start', () => onStart(block.id, teamLeader))}
                disabled={busy !== null}
                className="btn-amber"
                style={{ fontSize: 13 }}
              >
                <Play size={15} />
                {busy === 'start' ? 'Taking disconnection…' : 'Start Block Maintenance'}
              </button>
            </div>
          ) : block.status === 'IN_PROGRESS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => run('complete', () => onComplete(block.id, 'All tasks completed; line cleared.'))}
                  disabled={busy !== null || doneCount < total}
                  className="btn-amber"
                  style={{
                    fontSize: 13,
                    background: doneCount < total ? 'var(--border-mid)' : 'var(--rail-snt)',
                    cursor: doneCount < total ? 'not-allowed' : 'pointer',
                  }}
                  title={doneCount < total ? 'Tick every task, or use a partial handback' : 'Hand the line back, all work complete'}
                >
                  <CheckCircle2 size={15} />
                  {busy === 'complete' ? 'Clearing line…' : 'Complete Block Maintenance'}
                </button>

                <button
                  onClick={() => setPartialOpen(v => !v)}
                  disabled={busy !== null || doneCount === total}
                  className="btn-ghost"
                  style={{
                    fontSize: 13, borderColor: 'var(--rail-td)', color: 'var(--rail-td)',
                    opacity: doneCount === total ? 0.45 : 1,
                    cursor: doneCount === total ? 'not-allowed' : 'pointer',
                  }}
                  title={doneCount === total ? 'Nothing outstanding — complete the block instead' : 'Hand back with work outstanding'}
                >
                  <PauseCircle size={15} />
                  Mark Partially Done
                </button>
              </div>

              {doneCount < total && (
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {total - doneCount} task(s) still outstanding — complete them all, or hand back
                  partially and let the AI reschedule the remainder.
                </span>
              )}

              {partialOpen && (
                <div style={{
                  background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 11, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                    <GitBranch size={14} color="var(--rail-td)" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--rail-td)' }}>
                      Partial Handback — {total - doneCount} task(s) will be auto-rescheduled
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                    The line is handed back now. The AI window optimiser immediately re-scores the
                    remaining traffic windows on {block.section} and books the outstanding work into
                    the next-best slot, so nothing drops off the plan.
                  </p>
                  <textarea
                    rows={2}
                    value={partialReason}
                    onChange={(e) => setPartialReason(e.target.value)}
                    placeholder="Reason for partial handback (e.g. late-running 12123 Deccan Queen consumed the window)…"
                    className="warm-input font-mono"
                    style={{ resize: 'none', marginBottom: 10, fontSize: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
                    <button onClick={() => setPartialOpen(false)} className="btn-ghost" style={{ fontSize: 12 }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => run('partial', async () => {
                        await onPartial(block.id, [...checked], partialReason.trim() || 'Window expired with work outstanding.');
                        setPartialOpen(false);
                        setPartialReason('');
                      })}
                      disabled={busy !== null}
                      className="btn-amber"
                      style={{ fontSize: 12, background: 'var(--rail-td)' }}
                    >
                      <PauseCircle size={14} />
                      {busy === 'partial' ? 'Re-optimising…' : 'Hand Back & Auto-Reschedule'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : block.status === 'PARTIALLY_DONE' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--rail-td)', fontWeight: 700 }}>
                Line handed back with {total - doneCount} task(s) outstanding.
                {block.carried_forward_to && ` Rescheduled to ${block.carried_forward_to}.`}
              </span>
            </div>
          ) : (
            <div className="font-mono" style={{
              background: 'var(--sage-bg)', border: '1px solid var(--sage-border)',
              borderRadius: 9, padding: '10px 13px', fontSize: 11, color: 'var(--sage-text)',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <CheckCircle2 size={14} />
              Block complete — line cleared
              {block.completed_by && ` by ${block.completed_by}`}
              {block.actual_duration_hrs != null && ` in ${fmtHrs(block.actual_duration_hrs)}`}
              {block.overrun_min > 0
                ? ` (${block.overrun_min.toFixed(0)} min over plan)`
                : block.actual_duration_hrs != null ? ' (within plan)' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
