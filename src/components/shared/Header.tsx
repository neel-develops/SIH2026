import React from 'react';
import { useStore, NetworkTier } from '../../lib/store/useStore';
import { SEEDED_USERS } from '../../lib/mocks/seedData';
import { Train, Wifi, WifiOff, SignalLow, UserCheck, ShieldAlert, ChevronRight, Globe, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    demoLogin,
    networkTier,
    setNetworkTier, 
    currentRoute, 
    setCurrentRoute,
    lang,
    setLang 
  } = useStore();

  const navItems = [
    { route: '/dashboard', label: lang === 'EN' ? 'Dashboard' : 'डैशबोर्ड', acronym: 'DSH' },
    { route: '/block-plans', label: lang === 'EN' ? 'Block Plans' : 'ब्लॉक योजनाएं', acronym: 'GNT' },
    { route: '/defects', label: lang === 'EN' ? 'Defects Queue' : 'त्रुटि सूची', acronym: 'DEF' },
    { route: '/map', label: lang === 'EN' ? 'GIS Network Map' : 'जीआईएस मानचित्र', acronym: 'MAP' },
    { route: '/reports', label: lang === 'EN' ? 'Analytics & Reports' : 'विश्लेषण व रिपोर्ट', acronym: 'RPT' },
    { route: '/field', label: lang === 'EN' ? 'Mobile PWA' : 'मोबाइल क्षेत्र', acronym: 'PWA' },
    { route: '/admin/users', label: lang === 'EN' ? 'Admin RBAC' : 'व्यवस्थापक', acronym: 'ADM' },
  ];

  return (
    <header className="bg-[#0B1220] border-b border-[#253449] sticky top-0 z-50 select-none">
      {/* Top Status & Simulator Bar */}
      <div className="bg-[#16202E] px-4 py-1.5 border-b border-[#253449] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold tracking-wider text-amber-400">
            <Train className="w-4 h-4 text-blue-400" />
            <span>INDIAN RAILWAYS · RailSync</span>
            <span className="bg-blue-900/60 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-blue-700/50">
              SIH #26027
            </span>
          </div>
          <span className="text-[#253449]">|</span>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Scope:</span>
            <span className="font-mono text-slate-200">CR / MUMBAI / CSTM–PUNE</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Demo Network Simulator */}
          <div className="flex items-center space-x-2 bg-[#0B1220] px-2 py-0.5 rounded border border-[#253449]">
            <span className="text-[11px] text-slate-400 font-medium">Network Simulator:</span>
            {(['ONLINE', '3G', 'OFFLINE'] as NetworkTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setNetworkTier(tier)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  networkTier === tier
                    ? tier === 'ONLINE'
                      ? 'bg-emerald-600 text-white shadow'
                      : tier === '3G'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier === 'ONLINE' && <Wifi className="w-3 h-3 inline mr-1" />}
                {tier === '3G' && <SignalLow className="w-3 h-3 inline mr-1" />}
                {tier === 'OFFLINE' && <WifiOff className="w-3 h-3 inline mr-1" />}
                {tier}
              </button>
            ))}
          </div>

          {/* Persona / Demo Account Switcher */}
          <div className="flex items-center space-x-2 bg-[#0B1220] px-2 py-0.5 rounded border border-[#253449]">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={currentUser.role}
              onChange={(e) => { void demoLogin(e.target.value); }}
              className="bg-transparent text-slate-200 font-mono text-[11px] outline-none cursor-pointer"
            >
              {SEEDED_USERS.map((usr) => (
                <option key={usr.id} value={usr.role} className="bg-[#16202E] text-slate-200">
                  {usr.name} ({usr.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
            className="flex items-center space-x-1 bg-[#0B1220] hover:bg-[#16202E] px-2 py-0.5 rounded border border-[#253449] text-[11px] font-mono text-slate-300"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{lang === 'EN' ? 'EN' : 'हिन्दी'}</span>
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="px-4 flex items-center justify-between h-12">
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => setCurrentRoute(item.route)}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-[#16202E] hover:text-white border border-transparent'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60 bg-[#16202E] px-1 py-0.2 rounded border border-[#253449]">
                  {item.acronym}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Generate Plan Action Button */}
        <button
          onClick={() => setCurrentRoute('/block-plans/generate')}
          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-1.5 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/40"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GENERATE AI PLAN</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3G / Offline Banner Notification if simulated */}
      {networkTier !== 'ONLINE' && (
        <div
          className={`px-4 py-1 text-[11px] font-mono flex items-center justify-between ${
            networkTier === '3G'
              ? 'bg-amber-950/80 text-amber-200 border-t border-amber-800/50'
              : 'bg-red-950/80 text-red-200 border-t border-red-800/50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {networkTier === '3G'
                ? '3G Low-Bandwidth Mode Active — Skeletons & compressed data enabled.'
                : 'Offline Mode Active — Operating from IndexedDB cache. Changes queued.'}
            </span>
          </div>
          <span className="underline cursor-pointer" onClick={() => setNetworkTier('ONLINE')}>
            Switch to Online 5G
          </span>
        </div>
      )}
    </header>
  );
};
