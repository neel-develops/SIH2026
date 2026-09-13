import React, { useEffect, useState } from 'react';
import { useStore } from './lib/store/useStore';
import { Sidebar } from './components/shared/Sidebar';
import { TopBar } from './components/shared/TopBar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { BlockPlansView } from './views/BlockPlansView';
import { GeneratePlanView } from './views/GeneratePlanView';
import { PlanDetailView } from './views/PlanDetailView';
import { DefectsView } from './views/DefectsView';
import { DefectDetailView } from './views/DefectDetailView';
import { NewDefectView } from './views/NewDefectView';
import { MapView } from './views/MapView';
import { ReportsView } from './views/ReportsView';
import { FieldPWAView } from './views/FieldPWAView';
import { ExecutionView } from './views/ExecutionView';
import { AdminUsersView } from './views/AdminUsersView';
import { AIChatWidget } from './components/ai/AIChatWidget';

export const App: React.FC = () => {
  const { currentRoute, currentUser, restoreSession } = useStore();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setRestoring(false));
  }, []);

  if (restoring) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-amber" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--amber-500)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Loading RailSync...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentRoute === '/login') {
    return <LoginView />;
  }

  const renderRoute = () => {
    switch (currentRoute) {
      case '/dashboard':            return <DashboardView />;
      case '/block-plans':          return <BlockPlansView />;
      case '/block-plans/generate': return <GeneratePlanView />;
      case '/block-plans/detail':   return <PlanDetailView />;
      case '/execution':            return <ExecutionView />;
      case '/defects':              return <DefectsView />;
      case '/defects/detail':       return <DefectDetailView />;
      case '/defects/new':          return <NewDefectView />;
      case '/map':                  return <MapView />;
      case '/reports':              return <ReportsView />;
      case '/field':                return <FieldPWAView />;
      case '/admin/users':          return <AdminUsersView />;
      default:
        if (currentRoute.startsWith('/block-plans/')) return <PlanDetailView />;
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1, background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }} className="anim-fade-up">
            {renderRoute()}
          </div>
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
};

export default App;
