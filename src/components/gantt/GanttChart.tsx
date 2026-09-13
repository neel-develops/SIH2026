import React, { useState, useMemo, useEffect } from 'react';
import type { ApiBlock } from '../../lib/api';
import { Calendar, Filter, Edit3, GitBranch, CheckCircle2, PauseCircle, Play } from 'lucide-react';

/** Corridor running order — used to sort rows, not to restrict them. */
const SECTION_ORDER = ['CSTM-KYN', 'KYN-KJT', 'KJT-IGP', 'IGP-LNL', 'LNL-PUNE', 'KYN-KSRA'];

const ROW_LANE_HEIGHT = 26;
const BAR_HEIGHT = 21;
const ROW_PADDING = 8;

interface GanttChartProps {
  blocks: ApiBlock[];
  planId: string;
  horizonStart?: string;
  onOverrideBlock?: (blockId: string, reason: string) => void;
}

interface PositionedBlock {
  block: ApiBlock;
  leftPct: number;
  widthPct: number;
  lane: number;
}

/**
 * Pack bars into non-overlapping lanes (greedy interval partitioning).
 *
 * The previous implementation offset bars by `index % 2`, which silently hid
 * overlaps whenever a section had three or more concurrent blocks — and the
 * optimiser routinely produces that.
 */
function packIntoLanes(
  items: { block: ApiBlock; leftPct: number; widthPct: number }[],
): { positioned: PositionedBlock[]; laneCount: number } {
  const sorted = [...items].sort((a, b) => a.leftPct - b.leftPct);
  const laneEnds: number[] = [];
  const positioned: PositionedBlock[] = [];

  for (const item of sorted) {
    // A small gutter keeps adjacent bars visually distinct.
    const GUTTER = 0.35;
    let lane = laneEnds.findIndex(end => item.leftPct >= end + GUTTER);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.leftPct + item.widthPct;
    positioned.push({ ...item, lane });
  }

  return { positioned, laneCount: Math.max(1, laneEnds.length) };
}

export const GanttChart: React.FC<GanttChartProps> = ({ blocks, planId, horizonStart, onOverrideBlock }) => {
  const [horizon, setHorizon] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeModalBlock, setActiveModalBlock] = useState<ApiBlock | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [hoveredBlock, setHoveredBlock] = useState<ApiBlock | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Keep the "now" marker honest without re-rendering constantly.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const days = horizon === 'WEEKLY' ? 7 : 30;

  // Sections come from the data, so a block on an unexpected section is still
  // visible rather than silently dropped by a hardcoded list.
  const sections = useMemo(() => {
    const present = new Set(blocks.map(b => b.section));
    SECTION_ORDER.forEach(s => present.add(s));
    return [...present].sort((a, b) => {
      const ia = SECTION_ORDER.indexOf(a);
      const ib = SECTION_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [blocks]);

  const startDate = useMemo(() => {
    // Anchor on the earliest block so bars are never scheduled off-canvas — a
    // carry-forward block can legitimately land before the plan's horizon start.
    const candidates: number[] = [];
    if (horizonStart) candidates.push(new Date(horizonStart).getTime());
    blocks.forEach(b => candidates.push(new Date(b.scheduled_start).getTime()));

    const earliest = candidates.length ? Math.min(...candidates) : Date.now();
    const d = new Date(earliest);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [horizonStart, blocks]);

  const totalMs = days * 24 * 60 * 60 * 1000;

  const dayLabels = useMemo(() => {
    const labels: { label: string; isToday: boolean }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      labels.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        isToday: d.getTime() === today.getTime(),
      });
    }
    return labels;
  }, [startDate, days]);

  const filteredBlocks = useMemo(() => blocks.filter(b => {
    if (selectedDept !== 'ALL' && b.department !== selectedDept && !(b.is_combined && (b.combined_departments || []).includes(selectedDept))) return false;
    if (selectedSection !== 'ALL' && b.section !== selectedSection) return false;
    if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
    return true;
  }), [blocks, selectedDept, selectedSection, selectedStatus]);

  // Blocks that fall outside the visible horizon — surfaced rather than hidden.
  const outOfRangeCount = useMemo(() => filteredBlocks.filter(b => {
    const t = new Date(b.scheduled_start).getTime();
    return t < startDate.getTime() || t > startDate.getTime() + totalMs;
  }).length, [filteredBlocks, startDate, totalMs]);

  const nowPct = ((now - startDate.getTime()) / totalMs) * 100;
  const showNowLine = nowPct >= 0 && nowPct <= 100;

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModalBlock && overrideReasonInput.trim() && onOverrideBlock) {
      onOverrideBlock(activeModalBlock.id, overrideReasonInput.trim());
      setActiveModalBlock(null);
      setOverrideReasonInput('');
    }
  };

  const getDeptColor = (dept: string) => {
    if (dept === 'ENG') return 'var(--rail-eng)';
    if (dept === 'S&T' || dept === 'SNT') return 'var(--rail-snt)';
    if (dept === 'TD') return 'var(--rail-td)';
    return 'var(--amber-700)';
  };

  /** Execution status dominates the bar colour — the plan is secondary to reality. */
  const getBarColor = (blk: ApiBlock) => {
    if (blk.status === 'COMPLETED') return 'var(--rail-snt)';
    if (blk.status === 'PARTIALLY_DONE') return 'var(--rail-td)';
    if (blk.status === 'IN_PROGRESS') return 'var(--amber-500)';
    if (blk.is_combined) return 'var(--amber-600, #D97706)';
    return getDeptColor(blk.department);
  };

  const statusIcon = (status: string) => {
    if (status === 'COMPLETED') return <CheckCircle2 size={9} />;
    if (status === 'PARTIALLY_DONE') return <PauseCircle size={9} />;
    if (status === 'IN_PROGRESS') return <Play size={9} />;
    return null;
  };

  const selectStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', outline: 'none',
    fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif', fontWeight: 600,
  };

  return (
    <div className="warm-card" style={{ padding: '20px 24px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar size={16} color="var(--amber-700)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>RailSync Interactive Block Gantt Timeline</span>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-soft)', padding: 3 }}>
            {(['WEEKLY', 'MONTHLY'] as const).map(h => (
              <button key={h} onClick={() => setHorizon(h)} className="font-mono"
                style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: horizon === h ? 'var(--amber-700)' : 'transparent', color: horizon === h ? '#fff' : 'var(--text-muted)' }}>
                {h === 'WEEKLY' ? '7-Day' : '30-Day'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={selectStyle}>
              <option value="ALL">All Depts</option>
              <option value="ENG">ENG</option>
              <option value="S&T">S&T</option>
              <option value="TD">TD</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px' }}>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={selectStyle}>
              <option value="ALL">All Sections</option>
              {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px' }}>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={selectStyle}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PARTIALLY_DONE">Partially Done</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14, padding: '8px 14px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>DEPT:</span>
        {[{ label: 'ENG', color: 'var(--rail-eng)' }, { label: 'S&T', color: 'var(--rail-snt)' }, { label: 'TD', color: 'var(--rail-td)' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="bg-combined-hatch" style={{ width: 12, height: 10, borderRadius: 3, border: '1px solid var(--amber-300)' }} />
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-700)' }}>Combined</span>
        </div>

        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginLeft: 8 }}>STATUS:</span>
        {[
          { label: 'Live', color: 'var(--amber-500)' },
          { label: 'Partial', color: 'var(--rail-td)' },
          { label: 'Done', color: 'var(--rail-snt)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <GitBranch size={11} color="var(--amber-700)" />
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-700)' }}>Carry-fwd</span>
        </div>

        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filteredBlocks.length} block{filteredBlocks.length === 1 ? '' : 's'}
          {outOfRangeCount > 0 && (
            <span style={{ color: 'var(--rail-td)', fontWeight: 700 }}>
              {' '}· {outOfRangeCount} outside the {days}-day view
              {horizon === 'WEEKLY' ? ' — switch to 30-Day' : ''}
            </span>
          )}
          {' '}· Hover for AI rationale · Click to override
        </span>
      </div>

      {/* Gantt matrix */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 12, background: 'var(--bg-base)' }}>
        {/* Time axis */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
          <div className="font-mono" style={{ width: 130, minWidth: 130, padding: '10px 14px', borderRight: '1px solid var(--border-soft)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
            Section
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${days},1fr)`, minWidth: days * 80 }}>
            {dayLabels.map((d, i) => (
              <div key={i} className="font-mono" style={{
                padding: '10px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700,
                color: d.isToday ? 'var(--amber-700)' : 'var(--text-muted)',
                background: d.isToday ? 'var(--amber-100)' : 'transparent',
                borderRight: i < days - 1 ? '1px solid var(--border-soft)' : 'none',
              }}>
                {d.label}{d.isToday ? ' •' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Section rows */}
        <div>
          {sections.map((sec) => {
            const secBlocks = filteredBlocks.filter(b => b.section === sec);

            // Compute geometry once, then partition into non-overlapping lanes.
            const measured = secBlocks.map(blk => {
              const startMs = new Date(blk.scheduled_start).getTime();
              const endMs = new Date(blk.scheduled_end).getTime();
              const rawLeft = ((startMs - startDate.getTime()) / totalMs) * 100;
              const rawWidth = ((endMs - startMs) / totalMs) * 100;

              // Clip to the viewport instead of letting bars overflow the row.
              const leftPct = Math.max(0, Math.min(100, rawLeft));
              const clippedRight = Math.max(0, Math.min(100, rawLeft + rawWidth));
              const widthPct = Math.max(0.9, clippedRight - leftPct);
              return { block: blk, leftPct, widthPct };
            }).filter(m => m.leftPct < 100 && m.leftPct + m.widthPct > 0);

            const { positioned, laneCount } = packIntoLanes(measured);
            const rowHeight = Math.max(58, laneCount * ROW_LANE_HEIGHT + ROW_PADDING * 2);

            const liveCount = secBlocks.filter(b => b.status === 'IN_PROGRESS').length;

            return (
              <div key={sec} style={{ display: 'flex', minHeight: rowHeight, borderBottom: '1px solid var(--border-soft)' }}>
                <div className="font-mono" style={{ width: 130, minWidth: 130, padding: '12px 14px', borderRight: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{sec}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {secBlocks.length} block{secBlocks.length === 1 ? '' : 's'}
                  </div>
                  {liveCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span className="pulse-amber" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber-500)' }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber-700)' }}>{liveCount} LIVE</span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', minWidth: days * 80, minHeight: rowHeight }}>
                  {/* Day grid lines */}
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${days},1fr)`, pointerEvents: 'none' }}>
                    {Array.from({ length: days }).map((_, i) => (
                      <div key={i} style={{ borderRight: i < days - 1 ? '1px solid var(--border-soft)' : 'none', opacity: 0.5 }} />
                    ))}
                  </div>

                  {/* Current-time marker */}
                  {showNowLine && (
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: `${nowPct}%`, width: 2,
                      background: 'var(--rail-critical)', opacity: 0.75, pointerEvents: 'none', zIndex: 20,
                    }} />
                  )}

                  {/* Block bars — positioned by actual time, packed into lanes */}
                  {positioned.map(({ block: blk, leftPct, widthPct, lane }) => {
                    const isCombined = blk.is_combined;
                    const isOverridden = !!blk.override_reason;
                    const isCarryForward = (blk.carry_forward_generation ?? 0) > 0;
                    const isLive = blk.status === 'IN_PROGRESS';
                    const top = ROW_PADDING + lane * ROW_LANE_HEIGHT;
                    const barColor = getBarColor(blk);
                    const progress = blk.progress_pct ?? 0;

                    return (
                      <div
                        key={blk.id}
                        onMouseEnter={() => setHoveredBlock(blk)}
                        onMouseLeave={() => setHoveredBlock(null)}
                        onClick={() => setActiveModalBlock(blk)}
                        className={isCombined ? 'bg-combined-hatch' : ''}
                        title={`${blk.id} · ${blk.section} · ${blk.status.replace(/_/g, ' ')}`}
                        style={{
                          position: 'absolute', top, height: BAR_HEIGHT,
                          left: `${leftPct}%`, width: `${widthPct}%`,
                          borderRadius: 6, cursor: 'pointer',
                          background: barColor,
                          border: `1.5px solid ${isCarryForward ? 'var(--amber-300)' : isCombined ? 'var(--amber-300)' : 'rgba(255,255,255,0.3)'}`,
                          borderStyle: isCarryForward ? 'dashed' : 'solid',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0 5px', fontSize: 9, color: '#fff', fontWeight: 600,
                          boxShadow: isLive
                            ? '0 0 0 2px rgba(217,119,6,0.35), 0 2px 10px rgba(180,83,9,0.35)'
                            : isCombined ? '0 2px 12px rgba(180,83,9,0.3)' : '0 1px 4px rgba(0,0,0,0.15)',
                          transition: 'transform 0.12s',
                          outline: isOverridden ? '2px solid var(--amber-500)' : 'none',
                          zIndex: isLive ? 15 : isCombined ? 10 : 5,
                          overflow: 'hidden', whiteSpace: 'nowrap',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scaleY(1.15)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                      >
                        {/* Completion overlay — how much of this block is actually done */}
                        {progress > 0 && progress < 100 && (
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${progress}%`, background: 'rgba(255,255,255,0.32)',
                            pointerEvents: 'none',
                          }} />
                        )}

                        <span className="font-mono" style={{
                          fontSize: 9, fontWeight: 700, overflow: 'hidden',
                          textOverflow: 'ellipsis', position: 'relative', zIndex: 1,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          {statusIcon(blk.status)}
                          {isCarryForward && <GitBranch size={8} />}
                          {blk.department !== 'COMBINED' ? blk.department : '★'} {blk.duration_hrs}h
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                          {isOverridden && <Edit3 size={8} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover popover */}
      {hoveredBlock && (
        <div className="font-mono" style={{
          marginTop: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderLeft: '4px solid var(--amber-500)', borderRadius: 12, padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(180,83,9,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>
              {hoveredBlock.id} · {hoveredBlock.section} · {hoveredBlock.department} · Confidence: {(hoveredBlock.ai_confidence * 100).toFixed(0)}%
            </span>
            <span style={{ fontWeight: 700, color: 'var(--rail-snt)', fontSize: 12 }}>
              {new Date(hoveredBlock.scheduled_start).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — {hoveredBlock.duration_hrs}h
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className="chip chip-muted" style={{ fontSize: 9 }}>{hoveredBlock.status.replace(/_/g, ' ')}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {(hoveredBlock.completed_defect_ids?.length ?? 0)}/{hoveredBlock.defect_ids.length} tasks
              {' · '}{(hoveredBlock.progress_pct ?? 0).toFixed(0)}% complete
            </span>
            {hoveredBlock.actual_duration_hrs != null && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Actual: {hoveredBlock.actual_duration_hrs}h
              </span>
            )}
            {(hoveredBlock.overrun_min ?? 0) > 0 && (
              <span style={{ fontSize: 11, color: 'var(--rail-critical)', fontWeight: 700 }}>
                Overrun: {Math.round(hoveredBlock.overrun_min)} min
              </span>
            )}
            {(hoveredBlock.carry_forward_generation ?? 0) > 0 && (
              <span style={{ fontSize: 11, color: 'var(--amber-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GitBranch size={11} /> Carry-forward gen {hoveredBlock.carry_forward_generation}
                {hoveredBlock.carried_forward_from && ` from ${hoveredBlock.carried_forward_from}`}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{hoveredBlock.ai_rationale}</p>
          {hoveredBlock.partial_reason && (
            <p style={{ fontSize: 11, color: 'var(--rail-td)', marginTop: 4 }}>
              Partial handback: {hoveredBlock.partial_reason}
              {hoveredBlock.carried_forward_to && ` → rescheduled to ${hoveredBlock.carried_forward_to}`}
            </p>
          )}
          {hoveredBlock.override_reason && (
            <p style={{ fontSize: 11, color: 'var(--amber-700)', marginTop: 4, fontStyle: 'italic' }}>Override: {hoveredBlock.override_reason}</p>
          )}
        </div>
      )}

      {/* Override modal */}
      {activeModalBlock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="warm-card" style={{ maxWidth: 460, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--amber-700)" />
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Manual Override Block</span>
              </div>
              <button onClick={() => setActiveModalBlock(null)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="font-mono" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['Block ID', activeModalBlock.id],
                ['Section', activeModalBlock.section],
                ['Department', activeModalBlock.is_combined ? (activeModalBlock.combined_departments || []).join(', ') : activeModalBlock.department],
                ['Duration', `${activeModalBlock.duration_hrs}h`],
                ['AI Confidence', `${(activeModalBlock.ai_confidence * 100).toFixed(0)}%`],
                ['Defects', `${activeModalBlock.defect_ids.length} tasks`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', minWidth: 120 }}>{k}:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleOverrideSubmit}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Reason for Manual Override <span style={{ color: 'var(--rail-critical)' }}>*</span>
              </label>
              <textarea required rows={3} value={overrideReasonInput} onChange={(e) => setOverrideReasonInput(e.target.value)}
                placeholder="e.g. Adjust timing due to late-running express train..."
                className="warm-input font-mono" style={{ resize: 'none', marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setActiveModalBlock(null)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
                <button type="submit" className="btn-amber" style={{ fontSize: 13 }}>Commit Override & Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
