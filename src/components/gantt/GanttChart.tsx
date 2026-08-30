import React, { useState, useMemo } from 'react';
import type { ApiBlock } from '../../lib/api';
import { Calendar, Filter, Download, Edit3, Clock } from 'lucide-react';

const SECTIONS = ['CSTM-KYN', 'KYN-KJT', 'KJT-IGP', 'IGP-LNL', 'LNL-PUNE', 'KYN-KSRA'];

interface GanttChartProps {
  blocks: ApiBlock[];
  planId: string;
  horizonStart?: string;
  onOverrideBlock?: (blockId: string, reason: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ blocks, planId, horizonStart, onOverrideBlock }) => {
  const [horizon, setHorizon] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeModalBlock, setActiveModalBlock] = useState<ApiBlock | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [hoveredBlock, setHoveredBlock] = useState<ApiBlock | null>(null);

  const days = horizon === 'WEEKLY' ? 7 : 30;

  const startDate = useMemo(() => {
    if (horizonStart) return new Date(horizonStart);
    if (blocks.length > 0) {
      const earliest = blocks.reduce((min, b) => {
        const d = new Date(b.scheduled_start);
        return d < min ? d : min;
      }, new Date(blocks[0].scheduled_start));
      earliest.setHours(0, 0, 0, 0);
      return earliest;
    }
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return d;
  }, [horizonStart, blocks]);

  const totalMs = days * 24 * 60 * 60 * 1000;

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    }
    return labels;
  }, [startDate, days]);

  const filteredBlocks = useMemo(() => blocks.filter(b => {
    if (selectedDept !== 'ALL' && b.department !== selectedDept && !(b.is_combined && (b.combined_departments || []).includes(selectedDept))) return false;
    if (selectedSection !== 'ALL' && b.section !== selectedSection) return false;
    return true;
  }), [blocks, selectedDept, selectedSection]);

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
    if (dept === 'S&T') return 'var(--rail-snt)';
    if (dept === 'TD') return 'var(--rail-td)';
    return 'var(--amber-700)';
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
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>AABPS Interactive Block Gantt Timeline</span>
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
              {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, padding: '8px 14px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>LEGEND:</span>
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
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filteredBlocks.length} blocks · Hover for AI rationale · Click to override
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
            {dayLabels.map((label, i) => (
              <div key={i} className="font-mono" style={{ padding: '10px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', borderRight: i < days - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Section rows */}
        <div>
          {SECTIONS.map((sec) => {
            const secBlocks = filteredBlocks.filter(b => b.section === sec);
            return (
              <div key={sec} style={{ display: 'flex', minHeight: 72, borderBottom: '1px solid var(--border-soft)' }}>
                <div className="font-mono" style={{ width: 130, minWidth: 130, padding: '12px 14px', borderRight: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{sec}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{secBlocks.length} blocks</div>
                </div>

                <div style={{ flex: 1, position: 'relative', minWidth: days * 80, minHeight: 68 }}>
                  {/* Day grid lines */}
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${days},1fr)`, pointerEvents: 'none' }}>
                    {Array.from({ length: days }).map((_, i) => (
                      <div key={i} style={{ borderRight: i < days - 1 ? '1px solid var(--border-soft)' : 'none', opacity: 0.5 }} />
                    ))}
                  </div>

                  {/* Block bars — positioned by actual time */}
                  {secBlocks.map((blk, bIdx) => {
                    const blkStart = new Date(blk.scheduled_start);
                    const blkEnd = new Date(blk.scheduled_end);
                    const leftPct = Math.max(0, ((blkStart.getTime() - startDate.getTime()) / totalMs) * 100);
                    const widthPct = Math.max(2, ((blkEnd.getTime() - blkStart.getTime()) / totalMs) * 100);
                    const isCombined = blk.is_combined;
                    const isOverridden = !!blk.override_reason;
                    const topOffset = 8 + (bIdx % 2) * 28;

                    return (
                      <div
                        key={blk.id}
                        onMouseEnter={() => setHoveredBlock(blk)}
                        onMouseLeave={() => setHoveredBlock(null)}
                        onClick={() => setActiveModalBlock(blk)}
                        className={isCombined ? 'bg-combined-hatch' : ''}
                        style={{
                          position: 'absolute', top: topOffset, height: 24,
                          left: `${leftPct}%`, width: `${widthPct}%`,
                          borderRadius: 6, cursor: 'pointer',
                          background: isCombined ? 'var(--amber-600)' : getDeptColor(blk.department),
                          border: `1.5px solid ${isCombined ? 'var(--amber-300)' : 'rgba(255,255,255,0.3)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0 6px', fontSize: 9, color: '#fff', fontWeight: 600,
                          boxShadow: isCombined ? '0 2px 12px rgba(180,83,9,0.3)' : '0 1px 4px rgba(0,0,0,0.15)',
                          transition: 'transform 0.12s',
                          outline: isOverridden ? '2px solid var(--amber-500)' : 'none',
                          zIndex: isCombined ? 10 : 5,
                          overflow: 'hidden', whiteSpace: 'nowrap',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scaleY(1.15)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                      >
                        <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {blk.department !== 'COMBINED' ? blk.department : '★'} {blk.duration_hrs}h
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{hoveredBlock.ai_rationale}</p>
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
