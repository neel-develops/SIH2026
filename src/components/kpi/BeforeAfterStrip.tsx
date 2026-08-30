import React, { useState } from 'react';
import { Layers, Zap, CheckCircle2 } from 'lucide-react';

export const BeforeAfterStrip: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="warm-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="var(--amber-700)" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            RailSync Signature Impact — Cross-Department Block Consolidation
          </h3>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-ghost"
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          <Zap size={13} color="var(--amber-700)" />
          {collapsed ? 'Reset 3 Blocks View' : 'Simulate AI Consolidation'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* BEFORE: 3 separate blocks */}
        <div style={{
          background: 'var(--bg-raised)', borderRadius: 14,
          border: '1px solid var(--border-soft)', padding: '14px 16px',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--rail-critical)' }}>
              BEFORE RailSync (Legacy BDMS)
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              3 Blocks = 9.5 Hrs Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'ENG Block (Track Tamping)', time: '01:00 – 04:30 (3.5h)', color: 'var(--rail-eng)' },
              { label: 'S&T Block (Point Machine)',  time: '05:30 – 08:30 (3.0h)', color: 'var(--rail-snt)' },
              { label: 'TD Block (OHE Wire Snap)',   time: '10:00 – 13:00 (3.0h)', color: 'var(--rail-td)' },
            ].map((blk, i) => (
              <div
                key={i}
                className="font-mono"
                style={{
                  height: 32, borderRadius: 8,
                  background: blk.color, opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(110%)' : 'none',
                  transition: `all 0.5s ease ${i * 0.1}s`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 12px', fontSize: 11, color: '#fff', fontWeight: 600,
                }}
              >
                <span>{blk.label}</span>
                <span style={{ opacity: 0.85 }}>{blk.time}</span>
              </div>
            ))}
            {collapsed && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--amber-700)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Collapsing 3 separate downtime windows...
              </div>
            )}
          </div>
        </div>

        {/* AFTER: 1 combined amber block */}
        <div style={{
          background: 'var(--bg-raised)', borderRadius: 14,
          border: '2px solid var(--amber-300)', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-700)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={13} color="var(--rail-snt)" />
              AFTER RailSync (AI Combined Block)
            </span>
            <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--rail-snt)' }}>
              1 Block = 3.5 Hrs (−37%)
            </span>
          </div>

          <div className="bg-combined-hatch" style={{
            borderRadius: 10, border: '2px solid var(--amber-500)',
            padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{
                background: 'rgba(255,255,255,0.25)', borderRadius: 6, padding: '3px 10px',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                COMBINED BLOCK: ENG + S&T + TD
              </span>
              <span className="font-mono" style={{
                background: 'rgba(5,150,105,0.25)', borderRadius: 6, padding: '3px 10px',
                fontSize: 10, fontWeight: 700, color: '#D1FAE5',
              }}>
                01:00 – 04:30 (3.5h Window)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'ENG Track', sub: 'KM 42.3–54.0' },
                { label: 'S&T Signal', sub: 'Point #14B' },
                { label: 'TD Traction', sub: 'OHE Isolation' },
              ].map((c, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: '8px 10px',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}>
                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: '#fff', display: 'block' }}>{c.label}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{c.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
