import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { Smartphone, CheckCircle2, PlusCircle, WifiOff, Play } from 'lucide-react';

export const FieldPWAView: React.FC = () => {
  const { currentUser, networkTier, defects, setCurrentRoute } = useStore();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TASKS' | 'OFFLINE'>('TODAY');
  const [startedBlockId, setStartedBlockId] = useState<string | null>(null);
  const myTasks = defects.filter((d) => d.blockSection === 'KYN-KSRA').slice(0, 4);

  const tabs = [
    { id: 'TODAY', label: 'Today' },
    { id: 'TASKS', label: 'My Tasks' },
    { id: 'OFFLINE', label: 'Offline Tray' },
  ] as const;

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="warm-card" style={{ padding: 0, overflow: 'hidden', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div style={{ background: 'var(--amber-900)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} color="#FCD34D" />
            <div>
              <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>AABPS FIELD PWA</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{currentUser.name} ({currentUser.designation})</div>
            </div>
          </div>
          <span className={`chip font-mono`} style={{
            fontSize: 10, fontWeight: 700,
            background: networkTier === 'OFFLINE' ? 'var(--rail-critical)' : 'var(--rail-snt)',
            color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {networkTier === 'OFFLINE' ? <><WifiOff size={10} /> OFFLINE</> : '3G/5G ONLINE'}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                Today's Scheduled Blocks (KYN–KSRA)
              </h3>
              <div className="warm-card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--amber-700)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13, display: 'block' }}>BLK-2026-0331-01</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>KYN-KSRA · KM 42.0-58.0</span>
                  </div>
                  <span className="chip chip-amber" style={{ fontSize: 10 }}>COMBINED BLOCK</span>
                </div>
                <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12 }}>
                  <div className="font-mono" style={{ color: 'var(--text-secondary)' }}>Time Window: <strong>01:00 – 04:30 (3.5h)</strong></div>
                  <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>Departments: <strong>ENG + S&T + TD</strong></div>
                </div>
                {startedBlockId === 'BLK-2026-0331-01' ? (
                  <button onClick={() => setStartedBlockId(null)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13, borderColor: 'var(--rail-snt)', color: 'var(--rail-snt)' }}>
                    <CheckCircle2 size={15} /> Complete Block & Log Restoration
                  </button>
                ) : (
                  <button onClick={() => setStartedBlockId('BLK-2026-0331-01')} className="btn-amber" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                    <Play size={14} /> Start Maintenance Block Work
                  </button>
                )}
              </div>
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
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>KM {t.kmPost}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{t.assetType}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'OFFLINE' && (
            <div className="warm-card" style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
                Offline IndexedDB Tray
              </h3>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                0 items pending upload. Automatically syncs when 3G/5G connection re-establishes.
              </div>
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
