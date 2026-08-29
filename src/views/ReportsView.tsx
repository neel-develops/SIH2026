import React from 'react';
import { useStore } from '../lib/store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileSpreadsheet, FileText } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { kpi } = useStore();

  const deptData = [
    { name: 'ENG (Engineering)',          value: 74, color: 'var(--rail-eng)' },
    { name: 'S&T (Signal & Telecom)',      value: 42, color: 'var(--rail-snt)' },
    { name: 'TD (Traction Distribution)',  value: 32, color: 'var(--rail-td)' },
  ];

  const complianceData = [
    { section: 'CSTM-BY', planned: 28, completed: 26 },
    { section: 'BY-DR',   planned: 32, completed: 30 },
    { section: 'DR-KYN',  planned: 45, completed: 42 },
    { section: 'KYN-KSRA',planned: 54, completed: 51 },
    { section: 'KSRA-LNL',planned: 22, completed: 21 },
    { section: 'LNL-PUNE',planned: 38, completed: 35 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div className="warm-card" style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
            Performance Analytics & Executive Reports
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Asset Availability Index (AAI), Department Compliance & Combined Block Efficiency
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => alert('Exporting Official Executive PDF Report...')} className="btn-primary" style={{ fontSize: 12 }}>
            <FileText size={14} />
            Export PDF
          </button>
          <button onClick={() => alert('Exporting Raw Analytics Data to Excel (.xlsx)...')} className="btn-ghost" style={{ fontSize: 12 }}>
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Before vs After Impact slide */}
      <div className="warm-card" style={{ padding: '22px 26px', borderLeft: '4px solid var(--amber-700)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--amber-700)" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Before vs. After AABPS — Executive Impact Slide
            </h3>
          </div>
          <span className="chip chip-amber" style={{ fontSize: 11 }}>6 Months Simulation Data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: 'Asset Availability Index (AAI)', before: '82.0%', after: '91.2%', delta: '+9.2 Percentage Points', color: 'var(--amber-700)' },
            { label: 'Block Planning Time',            before: '3-5 Days', after: '< 45 Sec', delta: '99.4% Faster Automated Solves', color: 'var(--rail-snt)' },
            { label: 'Combined Block Rate',            before: '8.0%', after: '43.0%', delta: '5x Increase in Shared Windows', color: 'var(--rail-eng)' },
          ].map((m) => (
            <div key={m.label} style={{ background: 'var(--bg-raised)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border-soft)' }}>
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                {m.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span className="font-mono" style={{ fontSize: 15, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{m.before}</span>
                <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.after}</span>
              </div>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--rail-snt)' }}>{m.delta}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Compliance Bar Chart */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Planned vs. Completed Maintenance Blocks by Section
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <XAxis dataKey="section" stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis stroke="var(--border-mid)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border-soft)', borderRadius: 10, fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Bar dataKey="planned"   fill="var(--border-mid)" name="Planned Blocks" radius={[4,4,0,0]} />
                <Bar dataKey="completed" fill="var(--rail-snt)"   name="Completed Blocks" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept Pie chart */}
        <div className="warm-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Defect Distribution by Department (ENG / S&T / TD)
          </h3>
          <div style={{ height: 240, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border-soft)', borderRadius: 10, fontFamily: 'JetBrains Mono', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {deptData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block', flexShrink: 0 }} />
                  <div>
                    <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{d.value} defects</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
