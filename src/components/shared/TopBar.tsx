import React, { useState } from 'react';
import { useStore, NetworkTier } from '../../lib/store/useStore';
import { useTranslation } from '../../lib/i18n/translations';
import { SEEDED_USERS } from '../../lib/mocks/seedData';
import { Bell, BarChart2, Wifi, WifiOff, SignalLow, Globe, UserCheck, X, CheckCircle2 } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { currentUser, setCurrentUser, networkTier, setNetworkTier, lang, setLang, currentRoute, setCurrentRoute } = useStore();
  const t = useTranslation(lang);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [personaToast, setPersonaToast] = useState<string | null>(null);

  // Notifications mock feed
  const notifications = [
    { id: 1, title: 'Combined Block Approved', time: '10m ago', text: 'DRM Officer approved BLK-2026-0331-01 (KYN-KSRA)', type: 'success' },
    { id: 2, title: 'Speed Restriction Alert', time: '25m ago', text: 'TSR 30 km/h applied on DR-KYN due to rail fracture', type: 'alert' },
    { id: 3, title: 'COA Timetable Synced', time: '1h ago', text: '30 Train-free windows updated from NTES database', type: 'info' },
  ];

  // Derive page title from route
  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    '/dashboard':            { title: t.dashboard, subtitle: 'CSTM–PUNE corridor · Central Railway Mumbai' },
    '/block-plans':          { title: t.blockPlans, subtitle: 'Gantt timeline · 7-day & 30-day views' },
    '/block-plans/generate': { title: t.generateAIPlan, subtitle: 'OR-Tools CP-SAT · XGBoost · Prophet solver' },
    '/block-plans/detail':   { title: 'Plan Detail', subtitle: 'Multi-tier approval chain' },
    '/defects':              { title: t.defectsQueue, subtitle: 'XGBoost priority sorted · 290 open defects' },
    '/defects/detail':       { title: 'Defect Detail', subtitle: 'AI priority score breakdown' },
    '/defects/new':          { title: 'Log New Defect', subtitle: 'GPS location · QR scan · photo capture' },
    '/map':                  { title: t.gisMap, subtitle: 'Section health · time scrubber · defect overlay' },
    '/reports':              { title: t.analytics, subtitle: 'Before/After impact · PDF/Excel export' },
    '/field':                { title: t.mobilePWA, subtitle: 'Offline-first · IndexedDB sync queue' },
    '/admin/users':          { title: t.adminRBAC, subtitle: 'User management · role permissions' },
  };

  const { title, subtitle } = routeTitles[currentRoute] ?? { title: 'RailSync', subtitle: 'Indian Railways Block Planning' };

  return (
    <>
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: 16,
      }}>
        {/* Page title & Persona Switch Toast */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber-900)', margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
          </div>

          {personaToast && (
            <div className="anim-fade-up font-mono" style={{
              background: 'var(--sage-bg)', border: '1px solid var(--sage-border)',
              color: 'var(--sage-text)', padding: '4px 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <CheckCircle2 size={13} color="var(--rail-snt)" />
              <span>{personaToast}</span>
            </div>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Network Simulator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--bg-raised)', borderRadius: 10,
            border: '1px solid var(--border-soft)', padding: '4px 8px',
          }}>
            <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>{t.net}</span>
            {(['ONLINE', '3G', 'OFFLINE'] as NetworkTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setNetworkTier(tier)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: networkTier === tier
                    ? tier === 'ONLINE' ? '#059669' : tier === '3G' ? 'var(--amber-500)' : '#B91C1C'
                    : 'transparent',
                  color: networkTier === tier ? '#fff' : 'var(--text-muted)',
                }}
              >
                {tier === 'ONLINE' && <Wifi style={{ display: 'inline', width: 10, height: 10, marginRight: 3 }} />}
                {tier === '3G' && <SignalLow style={{ display: 'inline', width: 10, height: 10, marginRight: 3 }} />}
                {tier === 'OFFLINE' && <WifiOff style={{ display: 'inline', width: 10, height: 10, marginRight: 3 }} />}
                {tier}
              </button>
            ))}
          </div>

          {/* Persona switcher */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-raised)', borderRadius: 10,
            border: '1.5px solid var(--amber-300)', padding: '4px 10px',
          }}>
            <UserCheck size={14} color="var(--amber-700)" />
            <select
              value={currentUser.id}
              onChange={(e) => {
                const u = SEEDED_USERS.find((usr) => usr.id === e.target.value);
                if (u) {
                  setCurrentUser(u);
                  setPersonaToast(`Active Officer: ${u.name} (${u.role.replace(/_/g, ' ')})`);
                  setTimeout(() => setPersonaToast(null), 3000);
                }
              }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, fontWeight: 700, color: 'var(--amber-900)',
                cursor: 'pointer', fontFamily: 'Quicksand, sans-serif',
              }}
            >
              {SEEDED_USERS.map((usr) => (
                <option key={usr.id} value={usr.id} style={{ background: '#fff', color: '#111' }}>
                  {usr.name} — {usr.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-raised)', borderRadius: 10,
              border: '1px solid var(--border-soft)', padding: '6px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: 'var(--amber-900)',
            }}
          >
            <Globe size={14} color="var(--amber-700)" />
            <span>{lang === 'EN' ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* Notification bell button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: showNotifications ? 'var(--amber-100)' : 'var(--bg-raised)',
                border: `1px solid ${showNotifications ? 'var(--amber-300)' : 'var(--border-soft)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}
            >
              <Bell size={16} color="var(--amber-900)" />
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--rail-critical)', border: '1.5px solid var(--bg-surface)',
              }} />
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="warm-card" style={{
                position: 'absolute', top: 46, right: 0, width: 320, padding: '16px',
                zIndex: 60, boxShadow: '0 12px 36px rgba(124,61,18,0.18)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Control Room Alerts (3)</span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} color="var(--text-muted)" />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      background: 'var(--bg-raised)', padding: '10px 12px', borderRadius: 10,
                      borderLeft: `3px solid ${n.type === 'success' ? 'var(--rail-snt)' : n.type === 'alert' ? 'var(--rail-critical)' : 'var(--rail-eng)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analytics icon button */}
          <button
            onClick={() => setCurrentRoute('/reports')}
            title={t.analytics}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: currentRoute === '/reports' ? 'var(--amber-100)' : 'var(--bg-raised)',
              border: `1px solid ${currentRoute === '/reports' ? 'var(--amber-300)' : 'var(--border-soft)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <BarChart2 size={16} color="var(--amber-900)" />
          </button>

          {/* Avatar button */}
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--amber-100)', border: '1.5px solid var(--amber-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: 'var(--amber-700)', cursor: 'pointer',
            }}
          >
            {currentUser.name.charAt(0)}
          </button>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="warm-card" style={{ maxWidth: 400, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Railway Officer Profile</span>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: 'var(--amber-100)',
                border: '2px solid var(--amber-300)', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--amber-700)', marginBottom: 8,
              }}>
                {currentUser.name.charAt(0)}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{currentUser.name}</h3>
              <p className="font-mono" style={{ fontSize: 12, color: 'var(--amber-700)', margin: '2px 0 0' }}>{currentUser.designation}</p>
            </div>
            <div className="font-mono" style={{ background: 'var(--bg-raised)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-soft)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Role:</strong> {currentUser.role}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Zone/Division:</strong> {currentUser.scope.zone} / {currentUser.scope.division}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Sections:</strong> {currentUser.scope.sections.join(', ')}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Status:</strong> <span className="chip chip-sage" style={{ fontSize: 10 }}>Authenticated TOTP</span></div>
            </div>
            <button onClick={() => setShowProfileModal(false)} className="btn-amber" style={{ width: '100%', justifyContent: 'center' }}>
              Close Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
};
