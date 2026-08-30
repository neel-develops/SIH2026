import React, { useEffect, useMemo } from 'react';
import { useStore } from '../lib/store/useStore';
import { KPICard } from '../components/kpi/KPICard';
import { BeforeAfterStrip } from '../components/kpi/BeforeAfterStrip';
import { Activity, Layers, AlertOctagon, Clock, CheckSquare, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const DashboardView: React.FC = () => {
  const { kpi, defects, plans, setCurrentRoute, setSelectedDefectId, fetchKPI } = useStore();

  useEffect(() => { fetchKPI(); }, []);

  const criticalFeed = useMemo(() =>
    defects
      .filter((d) => d.criticality === 'CRITICAL' || d.priority_score >= 80)
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 5),
    [defects]
  );

  const aaiTrend = useMemo(() =>
    (kpi?.aai_trend || []).map((t) => ({
      date: t.date.slice(5, 10),
      value: t.aai,
    })),
    [kpi]
  );

  // Next 24h blocks from actual plans
  const next24hBlocks = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const blocks = plans.flatMap(p => p.blocks);
    return blocks
      .filter(b => {
        const start = new Date(b.scheduled_start);
        return start >= now && start <= cutoff;
      })
      .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
      .slice(0, 4);
  }, [plans]);

  if (!kpi) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div className="pulse-amber" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--amber-300)' }} />
        <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>Loading dashboard...</span>
      </div>
    );
  }

  const deptBreakdown = kpi.department_breakdown;
  const deptLabel = Object.entries(deptBreakdown).map(([k, v]) => `${v} ${k}`).join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14 }}>
        <KPICard title="Asset Availability (AAI)" value={`${kpi.aai_current}%`}
          subtitle={`Baseline: 82.0% | Target: ≥91.0%`}
          delta={`+${(kpi.aai_current - 82).toFixed(1)}%`} deltaType="positive"
          icon={TrendingUp} accentColor="var(--amber-700)" />
        <KPICard title="Blocks Scheduled Today" value={kpi.blocks_today}
          subtitle={`${Math.round(kpi.combined_block_rate * 100)}% Combined`} delta="Active" deltaType="neutral"
          icon={Layers} accentColor="var(--rail-eng)" />
        <KPICard title="Total Open Defects" value={kpi.open_defects}
          subtitle={deptLabel}
          icon={Activity} accentColor="var(--rail-td)" />
        <KPICard title="Overdue Maintenance" value={kpi.overdue_defects}
          subtitle="Action Required" delta="Overdue" deltaType="negative"
          icon={AlertOctagon} accentColor="var(--rail-critical)" />
        <KPICard title="Pending Approvals" value={kpi.pending_approvals}
          subtitle="Plans awaiting review" delta="Pending" deltaType="neutral"
          icon={CheckSquare} accentColor="var(--rail-signal)" />
        <KPICard title="Block Utilisation" value={`${Math.round(kpi.block_utilization * 100)}%`}
          subtitle={`Baseline: 65% (+${Math.round(kpi.block_utilization * 100) - 65} pts)`}
          delta={`+${Math.round(kpi.block_utilization * 100) - 65}%`} deltaType="positive"
          icon={Clock} accentColor="var(--rail-snt)" />
      </div>

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
            <span className="chip chip-sage" style={{ fontSize: 10 }}>Live</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {next24hBlocks.length === 0 && (
              <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No blocks in the next 24 hours</p>
            )}
            {next24hBlocks.map((blk) => {
              const start = new Date(blk.scheduled_start);
              const end = new Date(blk.scheduled_end);
              const hoursUntil = Math.max(0, (start.getTime() - Date.now()) / 3600000);
              const deptColors: Record<string, string> = { ENG: 'var(--rail-eng)', 'S&T': 'var(--rail-snt)', TD: 'var(--rail-td)', COMBINED: 'var(--amber-700)' };
              return (
                <div key={blk.id} style={{
                  background: 'var(--bg-raised)', borderRadius: 12,
                  border: '1px solid var(--border-soft)', borderLeft: `4px solid ${deptColors[blk.department] || 'var(--amber-700)'}`,
                  padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {blk.id} ({blk.section})
                    </div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {blk.department}{blk.is_combined ? ' Combined' : ''} · {blk.duration_hrs}h
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="chip chip-amber" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
                      T-{hoursUntil.toFixed(0)}h
                    </span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
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
              View All {kpi.open_defects} <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {criticalFeed.map((def) => {
              const daysOverdue = def.due_date ? Math.max(0, Math.floor((Date.now() - new Date(def.due_date).getTime()) / 86400000)) : 0;
              return (
                <div
                  key={def.id}
                  onClick={() => { setSelectedDefectId(def.id); setCurrentRoute('/defects/detail'); }}
                  style={{
                    background: 'var(--bg-raised)', borderRadius: 10,
                    border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--rail-critical)',
                    padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="chip chip-red" style={{ fontSize: 10 }}>{def.criticality}</span>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{def.id}</span>
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({def.section})</span>
                    </div>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {def.defect_type} — KM {def.km_from}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber-700)', display: 'block' }}>
                      {def.priority_score}
                    </span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {daysOverdue > 0 ? `Overdue: ${daysOverdue}d` : def.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AAI TREND + SECTION WORKLOAD */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--amber-700)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>90-Day Asset Availability Index (AAI %) Trend</span>
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)', fontWeight: 700 }}>
              82.0% → {kpi.aai_current}% (Target ≥91.0%)
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aaiTrend}>
                <defs>
                  <linearGradient id="aaiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis domain={[78, 96]} stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border-soft)', borderRadius: 10, fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <ReferenceLine y={91.0} stroke="var(--rail-snt)" strokeDasharray="4 4" label={{ value: 'Target 91.0%', fill: 'var(--rail-snt)', fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke="var(--amber-700)" strokeWidth={2.5} fillOpacity={1} fill="url(#aaiGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION WORKLOAD */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Section Workload</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kpi.section_workload.map((sec) => (
              <div key={sec.section} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-mono" style={{ width: 80, fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {sec.section}
                </span>
                <div style={{ flex: 1, height: 20, background: 'var(--bg-raised)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, (sec.defects / 60) * 100)}%`,
                    background: sec.defects > 40 ? 'var(--rail-critical)' : sec.defects > 20 ? 'var(--amber-500)' : 'var(--rail-snt)',
                    borderRadius: 6, transition: 'width 0.3s',
                  }} />
                </div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>
                  {sec.defects} def
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
