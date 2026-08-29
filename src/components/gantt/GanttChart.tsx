import React, { useState } from 'react';
import type { Block, Department } from '../../types';
import { BLOCK_SECTIONS } from '../../lib/mocks/seedData';
import { Calendar, Filter, Download, Edit3, Clock } from 'lucide-react';

interface GanttChartProps {
  blocks: Block[];
  onOverrideBlock: (blockId: string, reason: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ blocks, onOverrideBlock }) => {
  const [horizon, setHorizon] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedDept, setSelectedDept] = useState<Department | 'ALL'>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeModalBlock, setActiveModalBlock] = useState<Block | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);

  const filteredBlocks = blocks.filter(b => {
    if (selectedDept !== 'ALL' && !b.departments.includes(selectedDept)) return false;
    if (selectedSection !== 'ALL' && b.blockSection !== selectedSection) return false;
    return true;
  });

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModalBlock && overrideReasonInput.trim()) {
      onOverrideBlock(activeModalBlock.id, overrideReasonInput.trim());
      setActiveModalBlock(null);
      setOverrideReasonInput('');
    }
  };

  const getDeptStyle = (dept: Department): React.CSSProperties => {
    switch (dept) {
      case 'ENG': return { background: 'var(--rail-eng)', borderColor: '#93C5FD' };
      case 'SNT': return { background: 'var(--rail-snt)', borderColor: '#6EE7B7' };
      case 'TD':  return { background: 'var(--rail-td)', borderColor: '#FCA5A5' };
      default:    return { background: 'var(--amber-700)', borderColor: 'var(--amber-300)' };
    }
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

          {/* Horizon toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-soft)', padding: 3 }}>
            {(['WEEKLY', 'MONTHLY'] as const).map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className="font-mono"
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: horizon === h ? 'var(--amber-700)' : 'transparent',
                  color: horizon === h ? '#fff' : 'var(--text-muted)',
                }}
              >
                {h === 'WEEKLY' ? '7-Day' : '30-Day'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Dept filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Dept:</span>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value as any)} style={selectStyle}>
              <option value="ALL">All Departments</option>
              <option value="ENG">ENG (Engineering)</option>
              <option value="SNT">S&T (Signal)</option>
              <option value="TD">TD (Traction)</option>
            </select>
          </div>

          {/* Section filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Section:</span>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={selectStyle}>
              <option value="ALL">All Sections</option>
              {BLOCK_SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>

          <button onClick={() => alert('Exporting Gantt Schedule to PDF/Excel...')} className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, padding: '8px 14px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>LEGEND:</span>
        {[
          { label: 'ENG', color: 'var(--rail-eng)' },
          { label: 'S&T', color: 'var(--rail-snt)' },
          { label: 'TD',  color: 'var(--rail-td)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: 'inline-block' }} />
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="bg-combined-hatch" style={{ width: 12, height: 10, borderRadius: 3, display: 'inline-block', border: '1px solid var(--amber-300)' }} />
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-700)' }}>★ Combined Block</span>
        </div>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>Hover blocks for AI Rationale · Click to override</span>
      </div>

      {/* Gantt matrix */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 12, background: 'var(--bg-base)' }}>
        {/* Time axis */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
          <div className="font-mono" style={{ width: 140, minWidth: 140, padding: '10px 14px', borderRight: '1px solid var(--border-soft)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
            Section
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="font-mono" style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', borderRight: i < 6 ? '1px solid var(--border-soft)' : 'none' }}>
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div>
          {BLOCK_SECTIONS.map((sec, sIdx) => {
            const secBlocks = filteredBlocks.filter(b => b.blockSection === sec);
            return (
              <div key={sec} style={{ display: 'flex', minHeight: 72, borderBottom: '1px solid var(--border-soft)', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div className="font-mono" style={{ width: 140, minWidth: 140, padding: '12px 14px', borderRight: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{sec}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Quiet Gap: 01:00-04:30</div>
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {/* Grid lines */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ borderRight: i < 6 ? '1px solid var(--border-soft)' : 'none', opacity: 0.5 }} />
                  ))}

                  {/* Blocks */}
                  {secBlocks.map((blk) => {
                    const isCombined = blk.blockType === 'COMBINED' || blk.departments.length > 1;
                    const deptStyle = isCombined ? {} : getDeptStyle(blk.departments[0]);
                    return (
                      <div
                        key={blk.id}
                        onMouseEnter={() => setHoveredBlock(blk)}
                        onMouseLeave={() => setHoveredBlock(null)}
                        onClick={() => setActiveModalBlock(blk)}
                        className={isCombined ? 'bg-combined-hatch' : ''}
                        style={{
                          position: 'absolute', top: 12, height: 44,
                          left: `${(sIdx * 13 + 14) % 68}%`, width: `${isCombined ? 26 : 18}%`,
                          borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${isCombined ? 'var(--amber-300)' : 'rgba(255,255,255,0.3)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0 10px', fontSize: 11, color: '#fff', fontWeight: 600,
                          boxShadow: isCombined ? '0 2px 12px rgba(180,83,9,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'transform 0.12s, box-shadow 0.12s',
                          outline: blk.manuallyOverridden ? '2px solid var(--amber-500)' : 'none',
                          zIndex: isCombined ? 10 : 5,
                          ...deptStyle,
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                      >
                        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {blk.id}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} />
                          <span className="font-mono" style={{ fontSize: 10 }}>3.5h</span>
                          {blk.manuallyOverridden && <Edit3 size={10} color="var(--amber-300)" />}
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
              Block {hoveredBlock.id} ({hoveredBlock.blockSection}) — Confidence: {(hoveredBlock.aiConfidence * 100).toFixed(0)}%
            </span>
            <span style={{ fontWeight: 700, color: 'var(--rail-snt)', fontSize: 12 }}>Utilisation: {hoveredBlock.utilisationPct}%</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{hoveredBlock.aiRationale}</p>
          {hoveredBlock.overrideReason && (
            <p style={{ fontSize: 11, color: 'var(--amber-700)', marginTop: 4, fontStyle: 'italic' }}>Override: {hoveredBlock.overrideReason}</p>
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
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Manual Override Block Slot</span>
              </div>
              <button onClick={() => setActiveModalBlock(null)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="font-mono" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['Block ID', activeModalBlock.id],
                ['Section', activeModalBlock.blockSection],
                ['Departments', activeModalBlock.departments.join(', ')],
                ['AI Confidence', `${(activeModalBlock.aiConfidence * 100).toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', minWidth: 120 }}>{k}:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleOverrideSubmit}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Reason for Manual Override / Slot Adjustment <span style={{ color: 'var(--rail-critical)' }}>*</span>
              </label>
              <textarea
                required
                rows={3}
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
                placeholder="e.g. Adjust start by 30 minutes to accommodate late-running express train 12127..."
                className="warm-input font-mono"
                style={{ resize: 'none', marginBottom: 14 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setActiveModalBlock(null)} className="btn-ghost" style={{ fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-amber" style={{ fontSize: 13 }}>
                  Commit Override & Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
