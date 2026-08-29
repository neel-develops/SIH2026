import React, { useEffect } from 'react';
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
import { AdminUsersView } from './views/AdminUsersView';
import { db } from './lib/db/dexie';

export const App: React.FC = () => {
  const { currentRoute } = useStore();

  useEffect(() => {
    db.open().catch((err) => {
      console.warn('Failed to open Dexie IndexedDB:', err);
    });
  }, []);

  if (currentRoute === '/login') {
    return <LoginView />;
  }

  const renderRoute = () => {
    switch (currentRoute) {
      case '/dashboard':        return <DashboardView />;
      case '/block-plans':      return <BlockPlansView />;
      case '/block-plans/generate': return <GeneratePlanView />;
      case '/block-plans/detail':   return <PlanDetailView />;
      case '/defects':          return <DefectsView />;
      case '/defects/detail':   return <DefectDetailView />;
      case '/defects/new':      return <NewDefectView />;
      case '/map':              return <MapView />;
      case '/reports':          return <ReportsView />;
      case '/field':            return <FieldPWAView />;
      case '/admin/users':      return <AdminUsersView />;
      default:
        if (currentRoute.startsWith('/block-plans/')) return <PlanDetailView />;
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1, background: 'var(--bg-base)' }}>
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }} className="anim-fade-up">
            {renderRoute()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
