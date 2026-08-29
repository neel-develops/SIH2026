import React from 'react';
import { useStore } from '../lib/store/useStore';
import { KPICard } from '../components/kpi/KPICard';
import { BeforeAfterStrip } from '../components/kpi/BeforeAfterStrip';
import { Activity, Layers, AlertOctagon, Clock, CheckSquare, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const DashboardView: React.FC = () => {
  const { kpi, defects, setCurrentRoute, setSelectedDefectId } = useStore();

  const criticalFeed = defects
    .filter((d) => d.criticality === 'CRITICAL' || d.priorityScore >= 80)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14 }}>
        <KPICard title="Asset Availability (AAI)" value={`${kpi.aaiCurrent}%`}
          subtitle="Baseline: 82.0% | Target: ≥91.0%" delta="+9.2%" deltaType="positive"
          icon={TrendingUp} accentColor="var(--amber-700)" />
        <KPICard title="Blocks Scheduled Today" value={kpi.blocksToday}
          subtitle="4 Combined | 0 Conflicts" delta="Active" deltaType="neutral"
          icon={Layers} accentColor="var(--rail-eng)" />
        <KPICard title="Total Open Defects" value={kpi.openDefects}
          subtitle="74 ENG · 42 S&T · 32 TD"
          icon={Activity} accentColor="var(--rail-td)" />
        <KPICard title="Overdue Maintenance" value={kpi.overdueDefects}
          subtitle="-72% Reduction after AABPS" delta="Action Required" deltaType="negative"
          icon={AlertOctagon} accentColor="var(--rail-critical)" />
        <KPICard title="Pending Approvals" value={kpi.pendingApprovals}
          subtitle="1 Weekly Plan · 1 Override" delta="Pending" deltaType="neutral"
          icon={CheckSquare} accentColor="var(--rail-signal)" />
        <KPICard title="Block Utilisation" value={`${kpi.utilisationPct}%`}
          subtitle="Baseline: 65% (+20 pts)" delta="+20%" deltaType="positive"
          icon={Clock} accentColor="var(--rail-snt)" />
      </div>

      {/* SIGNATURE STRIP */}
      <BeforeAfterStrip />

      {/* NEXT 24H + CRITICAL DEFECTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* NEXT 24 HOURS */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} color="var(--rail-eng)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Next 24 Hours Scheduled Blocks</span>
            </div>
            <span className="chip chip-sage" style={{ fontSize: 10 }}>COA Synced</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'BLK-2026-0331-01', section: 'KYN-KSRA', dept: 'ENG + TD + S&T Combined', km: '42.0-58.0', time: '01:00 – 04:30 (3.5h)', countdown: 'T-MINUS 02h 14m', accentColor: 'var(--amber-700)', chipClass: 'chip-amber' },
              { id: 'BLK-2026-0331-02', section: 'BY-DR',    dept: 'ENG Track Tamping', km: '5.0-8.5', time: '07:30 – 10:30 (3.0h)', countdown: 'T-MINUS 08h 40m', accentColor: 'var(--rail-eng)', chipClass: 'chip-blue' },
              { id: 'BLK-2026-0331-03', section: 'LNL-PUNE', dept: 'TD OHE Substation', km: '130.0-145.0', time: '13:00 – 15:00 (2.0h)', countdown: 'T-MINUS 14h 10m', accentColor: 'var(--rail-td)', chipClass: 'chip-amber' },
            ].map((blk) => (
              <div key={blk.id} style={{
                background: 'var(--bg-raised)', borderRadius: 12,
                border: `1px solid var(--border-soft)`, borderLeft: `4px solid ${blk.accentColor}`,
                padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {blk.id} ({blk.section})
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {blk.dept} · KM {blk.km}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`chip ${blk.chipClass}`} style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
                    {blk.countdown}
                  </span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{blk.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRITICAL DEFECT FEED */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="var(--rail-critical)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Critical Defect Queue</span>
            </div>
            <button
              onClick={() => setCurrentRoute('/defects')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--rail-eng)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All 148 <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {criticalFeed.map((def) => (
              <div
                key={def.id}
                onClick={() => { setSelectedDefectId(def.id); setCurrentRoute('/defects'); }}
                style={{
                  background: 'var(--bg-raised)', borderRadius: 10,
                  border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--rail-critical)',
                  padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="chip chip-red" style={{ fontSize: 10 }}>{def.criticality}</span>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{def.id}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({def.blockSection})</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {def.assetType} — KM {def.kmPost}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="font-mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber-700)', display: 'block' }}>
                    {def.priorityScore}
                  </span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Overdue: {def.daysOverdue}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AAI TREND + WORKLOAD HEATMAP */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* RECHARTS AAI TREND */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--amber-700)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>90-Day Asset Availability Index (AAI %) Trend</span>
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)', fontWeight: 700 }}>
              82.0% → {kpi.aaiCurrent}% (Target ≥91.0%)
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpi.aaiTrend}>
                <defs>
                  <linearGradient id="aaiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D97706" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis domain={[78, 95]} stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid var(--border-soft)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                />
                <ReferenceLine y={91.0} stroke="var(--rail-snt)" strokeDasharray="4 4"
                  label={{ value: 'Target 91.0%', fill: 'var(--rail-snt)', fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke="var(--amber-700)" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#aaiGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WORKLOAD HEATMAP */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Workload Heatmap (Section × Week)</span>
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            Maintenance hours demanded per corridor section
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['CSTM-BY','BY-DR','DR-KYN','KYN-KSRA','KSRA-LNL','LNL-PUNE'].map((sec) => (
              <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-mono" style={{ width: 72, fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{sec}</span>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                  {Array.from({ length: 4 }).map((_, w) => {
                    const hrs = Math.floor(Math.random() * 25) + 10;
                    const isHigh = hrs > 24;
                    return (
                      <div key={w} className="font-mono" style={{
                        padding: '5px 4px', textAlign: 'center', borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: isHigh ? 'var(--amber-100)' : 'var(--bg-raised)',
                        color: isHigh ? 'var(--amber-700)' : 'var(--text-muted)',
                        border: `1px solid ${isHigh ? 'var(--amber-300)' : 'var(--border-soft)'}`,
                      }}>
                        W{w+1}:{hrs}h
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
