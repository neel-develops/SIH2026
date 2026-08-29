import React, { useState } from 'react';
import { useStore } from '../../lib/store/useStore';
import { useTranslation } from '../../lib/i18n/translations';
import {
  Train, LayoutDashboard, Calendar, HelpCircle, LogOut, Map,
  FileBarChart2, Smartphone, Users, AlertTriangle, Layers, X, Phone, Mail, FileText, Lock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentRoute, setCurrentRoute, currentUser, lang } = useStore();
  const t = useTranslation(lang);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Role permissions filtering
  const allNavItems = [
    { route: '/dashboard',         label: t.dashboard,        icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER', 'READ_ONLY_VIEWER'] },
    { route: '/block-plans',       label: t.blockPlans,       icon: Calendar,        roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER', 'READ_ONLY_VIEWER'] },
    { route: '/defects',           label: t.defectsQueue,     icon: AlertTriangle,   roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SSE_ENGINEERING', 'SSE_SIGNAL_TELECOM', 'SSE_TRACTION_DISTRIBUTION', 'JUNIOR_ENGINEER', 'READ_ONLY_VIEWER'] },
    { route: '/map',               label: t.gisMap,           icon: Map,             roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER', 'SSE_ENGINEERING', 'SSE_SIGNAL_TELECOM', 'SSE_TRACTION_DISTRIBUTION', 'JUNIOR_ENGINEER', 'READ_ONLY_VIEWER'] },
    { route: '/reports',           label: t.analytics,        icon: FileBarChart2,   roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER', 'READ_ONLY_VIEWER'] },
    { route: '/field',             label: t.mobilePWA,        icon: Smartphone,      roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'JUNIOR_ENGINEER', 'SSE_ENGINEERING', 'SSE_SIGNAL_TELECOM', 'SSE_TRACTION_DISTRIBUTION'] },
    { route: '/admin/users',       label: t.adminRBAC,        icon: Users,           roles: ['SUPER_ADMIN', 'ZONAL_ADMIN', 'SENIOR_OFFICER'] },
  ];

  const allowedNavItems = allNavItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const canGenerate = currentUser.role === 'DIVISIONAL_BLOCK_PLANNER' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ZONAL_ADMIN';

  return (
    <>
      <aside style={{
        width: 230,
        minHeight: '100vh',
        background: 'var(--bg-raised)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 14px',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 30,
      }}>
        {/* Brand Header */}
        <div 
          style={{ 
            marginBottom: 24, 
            padding: '4px 2px 0 2px', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }} 
          onClick={() => setCurrentRoute('/dashboard')}
        >
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="RailSync Logo" 
              style={{
                height: 38,
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
              }} 
            />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
            {t.maintenanceHub}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            {t.techOps}
          </div>
        </div>

        {/* Schedule New Task CTA */}
        {canGenerate ? (
          <button
            onClick={() => setCurrentRoute('/block-plans/generate')}
            className="btn-amber"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20, fontSize: 13, padding: '10px 12px' }}
          >
            <Layers size={15} />
            {t.generateAIPlan}
          </button>
        ) : (
          <div style={{
            background: 'var(--bg-surface)', border: '1px dashed var(--border-soft)',
            borderRadius: 12, padding: '8px 12px', marginBottom: 20, textAlign: 'center',
          }}>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Lock size={11} color="var(--text-muted)" />
              {currentUser.role === 'READ_ONLY_VIEWER' ? 'Read-Only Viewer' : `${currentUser.role.replace(/_/g, ' ')} Access`}
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {allowedNavItems.map(({ route, label, icon: Icon }) => {
            const isActive = currentRoute === route || (route !== '/dashboard' && currentRoute.startsWith(route));
            return (
              <button
                key={route}
                onClick={() => setCurrentRoute(route)}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--border-soft)',
            marginBottom: 6,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser.name}</div>
            <div className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber-700)' }}>{currentUser.role.replace(/_/g, ' ')}</div>
          </div>
          <button className="sidebar-nav-item" style={{ fontSize: 13 }} onClick={() => setShowSupportModal(true)}>
            <HelpCircle size={16} />
            <span>{t.support}</span>
          </button>
          <button
            className="sidebar-nav-item"
            style={{ fontSize: 13 }}
            onClick={() => setCurrentRoute('/login')}
          >
            <LogOut size={16} />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Support Helpdesk Modal */}
      {showSupportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="warm-card" style={{ maxWidth: 440, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} color="var(--amber-700)" />
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>RailNet Technical Support</span>
              </div>
              <button onClick={() => setShowSupportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              AABPS Help Desk — Central Railway Control Room, Mumbai Division.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'var(--bg-raised)', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={15} color="var(--amber-700)" />
                <div>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Internal Railway Hotline: 44290</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>24/7 Control Room Duty Officer</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-raised)', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={15} color="var(--amber-700)" />
                <div>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>support.aabps@railnet.gov.in</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Response within 15 minutes</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-raised)', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={15} color="var(--amber-700)" />
                <div>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>SIH 2026 Manual #26027</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ministry of Railways User Guide</div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSupportModal(false)} className="btn-amber" style={{ width: '100%', justifyContent: 'center' }}>
              Close Help Desk
            </button>
          </div>
        </div>
      )}
    </>
  );
};
