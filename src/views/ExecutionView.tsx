import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../lib/store/useStore';
import { BlockExecutionCard } from '../components/execution/BlockExecutionCard';
import { fmtHrs } from '../components/execution/BlockLifecycle';
import type { PartialCompleteResponse } from '../lib/api';
import {
  Radio, AlertTriangle, GitBranch, CheckCircle2, Clock, RotateCcw,
  Activity, TrendingUp, Sparkles, X, PauseCircle,
} from 'lucide-react';

type Tab = 'LIVE' | 'UPCOMING' | 'PARTIAL' | 'COMPLETED' | 'CARRY_FORWARD';

const OPERATOR_ROLES = new Set([
  'SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER',
  'SSE_ENGINEERING', 'SSE_SIGNAL_TELECOM', 'SSE_TRACTION_DISTRIBUTION', 'JUNIOR_ENGINEER',
]);

const RESET_ROLES = new Set(['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER']);

/**
 * Live Block Execution Control Room.
 *
 * One screen for the whole execution loop: what is running right now, what is
 * about to start, what came back partially done, and — the differentiator —
 * where the AI carry-forward engine has re-booked the unfinished work.
 */
export const ExecutionView: React.FC = () => {
  const {
    live, liveLoading, defects, currentUser,
    fetchLive, startBlock, reportProgress, partialComplete, completeBlock, resetDemo,
  } = useStore();

  const [tab, setTab] = useState<Tab>('LIVE');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'warn' | 'err'; text: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const canOperate = OPERATOR_ROLES.has(currentUser?.role ?? '');
  const canReset = RESET_ROLES.has(currentUser?.role ?? '');

  useEffect(() => { void fetchLive(); }, [fetchLive]);

  // Poll the control-room feed so a block started on a field device shows up
  // here without the officer having to reload.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { void fetchLive(); }, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLive]);

  const stats = live?.stats;

  const handlePartial = async (blockId: string, completed: string[], reason: string) => {
    const res: PartialCompleteResponse = await partialComplete(blockId, completed, reason);
    if (res.carry_forward) {
      const cf = res.carry_forward;
      setBanner({
        kind: 'ok',
        text:
          `AI carry-forward: ${cf.defect_ids.length} outstanding task(s) auto-rescheduled to ` +
          `${cf.id} on ${new Date(cf.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} ` +
          `(${(cf.ai_confidence * 100).toFixed(0)}% confidence). Nothing dropped off the plan.`,
      });
      setTab('CARRY_FORWARD');
    } else if (res.escalation) {
      setBanner({ kind: 'warn', text: `Escalated to the Divisional Planner — ${res.escalation.message}` });
    }
  };

  const handleComplete = async (blockId: string, remarks: string) => {
    const blk = await completeBlock(blockId, remarks);
    setBanner({
      kind: 'ok',
      text:
        `Block ${blk.id} completed — line cleared on ${blk.section}. ` +
        `${blk.defect_ids.length} task(s) done in ${fmtHrs(blk.actual_duration_hrs ?? 0)} ` +
        `against a ${fmtHrs(blk.duration_hrs)} plan` +
        `${blk.overrun_min > 0 ? ` (${blk.overrun_min.toFixed(0)} min over)` : ' (within plan)'}.`,
    });
  };

  const handleStart = async (blockId: string, teamLeader: string) => {
    const blk = await startBlock(blockId, teamLeader || undefined);
    setBanner({ kind: 'ok', text: `Disconnection taken — block ${blk.id} is now live on ${blk.section}.` });
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      setBanner({ kind: 'ok', text: 'Corridor reset — defect pool re-opened and execution state cleared.' });
    } catch (e) {
      setBanner({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setResetting(false);
    }
  };

  const tabs: { id: Tab; label: string; count: number; color: string }[] = useMemo(() => [
    { id: 'LIVE', label: 'Live Now', count: stats?.active_count ?? 0, color: 'var(--amber-700)' },
    { id: 'UPCOMING', label: 'Next Up', count: stats?.upcoming_count ?? 0, color: 'var(--rail-eng)' },
    { id: 'PARTIAL', label: 'Partially Done', count: stats?.partial_count ?? 0, color: 'var(--rail-td)' },
    { id: 'CARRY_FORWARD', label: 'AI Carry-Forward', count: stats?.carry_forward_count ?? 0, color: 'var(--amber-500)' },
    { id: 'COMPLETED', label: 'Completed', count: stats?.completed_count ?? 0, color: 'var(--rail-snt)' },
  ], [stats]);

  const blocksForTab = useMemo(() => {
    if (!live) return [];
    switch (tab) {
      case 'LIVE': return live.active_blocks;
      case 'UPCOMING': return live.upcoming_blocks;
      case 'PARTIAL': return live.partial_blocks;
      case 'COMPLETED': return live.recent_completions;
      case 'CARRY_FORWARD': {
        const ids = new Set(live.carry_forward_chains.map(c => c.block_id));
        const pool = [
          ...live.active_blocks, ...live.upcoming_blocks,
          ...live.partial_blocks, ...live.recent_completions,
        ];
        const seen = new Set<string>();
        return pool.filter(b => {
          if (!ids.has(b.id) || seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      }
      default: return [];
    }
  }, [live, tab]);

  const kpiTiles = [
    {
      label: 'Blocks Live Now', value: `${stats?.active_count ?? 0}`,
      icon: Radio, color: 'var(--amber-700)',
      hint: 'Disconnection taken, work in progress',
    },
    {
      label: 'Overrun Risk', value: `${stats?.at_risk_count ?? 0}`,
      icon: AlertTriangle, color: (stats?.at_risk_count ?? 0) > 0 ? 'var(--rail-critical)' : 'var(--rail-snt)',
      hint: 'Time burnt is outpacing work delivered',
    },
    {
      label: 'Auto-Rescheduled', value: `${stats?.carry_forward_defects ?? 0}`,
      icon: GitBranch, color: 'var(--rail-td)',
      hint: 'Tasks the AI recovered from partial blocks',
    },
    {
      label: 'On-Time Handback', value: `${(stats?.on_time_rate ?? 0).toFixed(0)}%`,
      icon: TrendingUp, color: 'var(--rail-snt)',
      hint: 'Blocks cleared within the planned window',
    },
    {
      label: 'Total Overrun', value: `${Math.round(stats?.total_overrun_min ?? 0)}m`,
      icon: Clock, color: 'var(--rail-eng)',
      hint: 'Cumulative minutes past plan across all blocks',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      {banner && (
        <div style={{
          background: banner.kind === 'ok' ? 'var(--sage-bg)' : banner.kind === 'warn' ? '#FFF7ED' : '#FEF2F2',
          border: `2px solid ${banner.kind === 'ok' ? 'var(--sage-border)' : banner.kind === 'warn' ? '#FED7AA' : '#FECACA'}`,
          color: banner.kind === 'ok' ? 'var(--sage-text)' : banner.kind === 'warn' ? 'var(--rail-td)' : '#B91C1C',
          padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {banner.kind === 'ok' ? <Sparkles size={17} /> : <AlertTriangle size={17} />}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="warm-card" style={{
        padding: '20px 24px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Activity size={20} color="var(--amber-700)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Live Block Execution Control Room
            </h2>
            {(stats?.active_count ?? 0) > 0 && (
              <span className="chip chip-amber" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="pulse-amber" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber-500)' }} />
                {stats?.active_count} LIVE
              </span>
            )}
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Start → Partially Done → Complete · AI carry-forward keeps unfinished work on the plan
            {live && ` · Synced ${new Date(live.server_time).toLocaleTimeString('en-IN')}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
            background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
            borderRadius: 10, padding: '7px 12px',
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--amber-700)', cursor: 'pointer' }}
            />
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Auto-refresh 15s
            </span>
          </label>

          <button onClick={() => void fetchLive()} disabled={liveLoading} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>
            <RotateCcw size={14} />
            {liveLoading ? 'Syncing…' : 'Refresh'}
          </button>

          {canReset && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '7px 14px', borderColor: 'var(--rail-critical)', color: 'var(--rail-critical)' }}
              title="Re-open the defect pool and clear execution state for a fresh demo run"
            >
              {resetting ? 'Resetting…' : 'Reset Demo Corridor'}
            </button>
          )}
        </div>
      </div>

      {/* ── KPI tiles ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13 }}>
        {kpiTiles.map(({ label, value, icon: Icon, color, hint }) => (
          <div key={label} className="warm-card" style={{ padding: '14px 17px', borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="font-mono" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </span>
              <Icon size={15} color={color} />
            </div>
            <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color, display: 'block', lineHeight: 1.1 }}>
              {value}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 4, lineHeight: 1.35 }}>
              {hint}
            </span>
          </div>
        ))}
      </div>

      {/* ── Overrun alerts ─────────────────────────────────────────────── */}
      {(live?.at_risk.length ?? 0) > 0 && (
        <div className="warm-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--rail-critical)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <AlertTriangle size={16} color="var(--rail-critical)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--rail-critical)' }}>
              Overrun Risk Alerts ({live?.at_risk.length})
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Time consumed vs work delivered — flagged before the next train path is affected
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {live?.at_risk.map(r => (
              <div key={r.block_id} style={{
                background: r.severity === 'OVERRUN' ? '#FEF2F2' : 'var(--bg-raised)',
                border: `1px solid ${r.severity === 'OVERRUN' ? '#FECACA' : 'var(--border-soft)'}`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <span className={`chip ${r.severity === 'OVERRUN' ? 'chip-red' : 'chip-amber'}`} style={{ fontSize: 9 }}>
                  {r.severity}
                </span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-700)' }}>
                  {r.block_id}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {r.section}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 220 }}>
                  {r.message}
                </span>
                <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--rail-critical)' }}>
                  {fmtHrs(r.elapsed_hrs)} / {fmtHrs(r.planned_hrs)}
                  {r.overrun_min > 0 && ` · +${Math.round(r.overrun_min)}m`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Carry-forward chain narrative ──────────────────────────────── */}
      {(live?.carry_forward_chains.length ?? 0) > 0 && (
        <div className="warm-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--amber-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <GitBranch size={16} color="var(--amber-700)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber-700)' }}>
              AI Carry-Forward Chain — {stats?.carry_forward_defects} task(s) recovered
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
            Every task left unfinished by a partial handback is re-scored against the remaining
            traffic windows and re-booked automatically. This is the loop that stops maintenance
            backlog from going invisible — the outstanding work always lands on a dated, named block.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {live?.carry_forward_chains.map(c => (
              <div key={c.block_id} style={{
                background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
                borderRadius: 10, padding: '11px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {c.parent_block_id}
                  </span>
                  <span style={{ color: 'var(--amber-700)', fontWeight: 700 }}>→</span>
                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-700)' }}>
                    {c.block_id}
                  </span>
                  <span className="chip chip-amber" style={{ fontSize: 9 }}>GEN {c.generation}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {c.section} · {c.defect_count} task(s)
                  </span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(c.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="chip chip-muted" style={{ fontSize: 9, marginLeft: 'auto' }}>{c.status.replace(/_/g, ' ')}</span>
                </div>
                {c.ai_rationale && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{c.ai_rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 7,
              background: tab === t.id ? t.color : 'var(--bg-raised)',
              color: tab === t.id ? '#fff' : 'var(--text-secondary)',
              borderColor: tab === t.id ? t.color : 'var(--border-soft)',
            }}
          >
            {t.label}
            <span className="font-mono" style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 6,
              background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface)',
              color: tab === t.id ? '#fff' : t.color,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Block list ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {blocksForTab.length === 0 ? (
          <div className="warm-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
            {tab === 'LIVE' ? (
              <>
                <Radio size={30} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
                  No blocks are live right now
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Open <strong>Next Up</strong> and press <strong>Start Block Maintenance</strong> to take a
                  disconnection and begin the execution loop.
                </p>
              </>
            ) : tab === 'CARRY_FORWARD' ? (
              <>
                <GitBranch size={30} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
                  No carry-forward blocks yet
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Start a block, tick off part of the checklist, then choose{' '}
                  <strong>Mark Partially Done</strong> — the AI will re-book the remainder here.
                </p>
              </>
            ) : tab === 'PARTIAL' ? (
              <>
                <PauseCircle size={30} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  No partial handbacks recorded.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 size={30} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Nothing to show in this view yet.
                </p>
              </>
            )}
          </div>
        ) : (
          blocksForTab.map((b, i) => (
            <BlockExecutionCard
              key={b.id}
              block={b}
              defects={defects}
              tasks={live?.tasks}
              serverTime={live?.server_time ?? new Date().toISOString()}
              canOperate={canOperate}
              onStart={handleStart}
              onProgress={async (id, completed) => { await reportProgress(id, completed); }}
              onPartial={handlePartial}
              onComplete={handleComplete}
              defaultExpanded={tab === 'LIVE' && i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
};
