import React, { useState, useEffect } from 'react';
import { STATIONS, BLOCK_SECTIONS } from '../../lib/mocks/seedData';
import type { ApiDefect } from '../../lib/api';
import { Map, Play, Pause } from 'lucide-react';
import { useStore } from '../../lib/store/useStore';

interface RailwayMapProps {
  defects: ApiDefect[];
}

export const RailwayMap: React.FC<RailwayMapProps> = ({ defects }) => {
  const { setCurrentRoute } = useStore();
  const [selectedSection, setSelectedSection] = useState<string | null>('KYN-KSRA');
  const [isPlayingScrubber, setIsPlayingScrubber] = useState(false);
  const [scrubberDay, setScrubberDay] = useState(1);

  useEffect(() => {
    let interval: any;
    if (isPlayingScrubber) {
      interval = setInterval(() => {
        setScrubberDay((prev) => (prev >= 7 ? 1 : prev + 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlayingScrubber]);

  const getSectionHealthColor = (secName: string) => {
    const secDefects = defects.filter((d) => d.section === secName);
    const hasCritical = secDefects.some((d) => d.criticality === 'CRITICAL');
    const hasHigh = secDefects.some((d) => d.criticality === 'HIGH');
    if (hasCritical) return 'var(--rail-critical)';
    if (hasHigh) return 'var(--amber-700)';
    return 'var(--rail-snt)';
  };

  return (
    <div className="warm-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Map size={18} color="var(--amber-700)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            GIS Railway Network Map — CSTM–PUNE Corridor
          </h2>
        </div>

        {/* Time scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-raised)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Time Scrubber:</span>
          <button
            onClick={() => setIsPlayingScrubber(!isPlayingScrubber)}
            className="btn-amber"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {isPlayingScrubber ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlayingScrubber ? 'Pause' : 'Replay Plan'}</span>
          </button>
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-700)' }}>
            Day {scrubberDay} of 7
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 18 }}>
        {/* Map schematic frame */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', minHeight: 380 }}>
          
          {/* Technical SVG Track Schematic */}
          <div style={{ position: 'relative', width: '100%', height: 260, margin: 'auto 0', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-soft)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Double Track Polyline lines */}
            <div style={{ position: 'absolute', left: 24, right: 24, top: '46%', height: 2, background: 'var(--border-mid)', zIndex: 0 }} />
            <div style={{ position: 'absolute', left: 24, right: 24, top: '54%', height: 2, background: 'var(--border-mid)', zIndex: 0 }} />

            {BLOCK_SECTIONS.map((sec, idx) => {
              const color = getSectionHealthColor(sec);
              const isSelected = selectedSection === sec;

              return (
                <div
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  style={{
                    position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                    transform: isSelected ? 'scale(1.12)' : 'none', transition: 'transform 0.15s ease',
                  }}
                >
                  {/* Station Node Marker */}
                  <div
                    className="font-mono"
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: `2.5px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11, background: '#fff', color,
                      boxShadow: isSelected ? '0 4px 16px rgba(180,83,9,0.25)' : 'none',
                    }}
                  >
                    {STATIONS[idx]?.code || 'STN'}
                  </div>

                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)', background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-soft)' }}>
                    {sec}
                  </span>

                  <span className="chip" style={{ fontSize: 9, marginTop: 4, background: color, color: '#fff', border: 'none' }}>
                    {color === 'var(--rail-critical)' ? 'CRITICAL' : color === 'var(--amber-700)' ? 'SCHEDULED' : 'HEALTHY'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Map legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-soft)', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>CORRIDOR HEALTH:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rail-critical)', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: 'var(--rail-critical)' }}>Critical Defect</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-700)', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: 'var(--amber-700)' }}>Scheduled Block</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rail-snt)', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: 'var(--rail-snt)' }}>Normal Ops</span>
              </div>
            </div>
            <span className="font-mono" style={{ color: 'var(--text-muted)' }}>CSTM (KM 0.0) → PUNE (KM 192.0)</span>
          </div>
        </div>

        {/* Selected Section Side Details Sheet */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Section Details</span>
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>{selectedSection || 'Select Section'}</span>
          </div>

          {selectedSection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="font-mono" style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-soft)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Section ID:</span> <strong>{selectedSection}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Length:</span> <strong>67.0 km</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Track Type:</span> <strong>Double Line Electric</strong></div>
              </div>

              <div>
                <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>OPEN DEFECTS IN SECTION:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {defects
                    .filter((d) => d.section === selectedSection)
                    .slice(0, 4)
                    .map((def) => (
                      <div key={def.id} className="font-mono" style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-soft)', fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: 'var(--amber-700)' }}>{def.id} ({def.department})</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>P: {def.priority_score}</span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{def.asset_type ?? def.defect_type} at KM {def.km_from}</p>
                      </div>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setCurrentRoute('/block-plans/generate')}
                className="btn-amber"
                style={{ width: '100%', justifyContent: 'center', fontSize: 12, marginTop: 4 }}
              >
                Schedule Block For {selectedSection}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
              Select a section on the map to view defects & upcoming blocks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
