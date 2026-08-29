import React, { useState } from 'react';
import { useStore } from '../lib/store/useStore';
import { Department, Criticality } from '../types';
import { Activity, Filter, Search, Plus, Layers } from 'lucide-react';

export const DefectsView: React.FC = () => {
  const { defects, filterDept, setFilterDept, filterCriticality, setFilterCriticality, setSelectedDefectId, setCurrentRoute } = useStore();
  const [search, setSearch] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const filteredDefects = defects.filter((d) => {
    if (filterDept !== 'ALL' && d.department !== filterDept) return false;
    if (filterCriticality !== 'ALL' && d.criticality !== filterCriticality) return false;
    if (search.trim() && !d.id.toLowerCase().includes(search.toLowerCase()) && !d.assetType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deptColor = (d: string) => d === 'ENG' ? 'var(--rail-eng)' : d === 'SNT' ? 'var(--rail-snt)' : 'var(--rail-td)';
  const critColor = (c: string) => c === 'CRITICAL' ? 'chip-red' : c === 'HIGH' ? 'chip-amber' : 'chip-muted';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div className="warm-card" style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <Activity size={18} color="var(--rail-td)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Unified Defect Queue (TMS + SMMS + TDMS)
            </h2>
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            148 Open Defects · 23 Overdue · Sorted by XGBoost Priority Score
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
            borderRadius: 10, padding: '7px 12px',
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search defect ID or asset..."
              className="font-mono"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-primary)', width: 180 }}
            />
          </div>
          <button onClick={() => setCurrentRoute('/defects/new')} className="btn-amber" style={{ fontSize: 12 }}>
            <Plus size={14} />
            Report Defect
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="warm-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Department:</span>
            {(['ALL', 'ENG', 'SNT', 'TD'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilterDept(d)}
                className="chip"
                style={{
                  cursor: 'pointer',
                  background: filterDept === d
                    ? d === 'ENG' ? 'var(--rail-eng)' : d === 'SNT' ? 'var(--rail-snt)' : d === 'TD' ? 'var(--rail-td)' : 'var(--amber-700)'
                    : 'var(--bg-raised)',
                  color: filterDept === d ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filterDept === d ? 'transparent' : 'var(--border-soft)'}`,
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Severity:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCriticality(c)}
                className="chip"
                style={{
                  cursor: 'pointer',
                  background: filterCriticality === c ? 'var(--rail-critical)' : 'var(--bg-raised)',
                  color: filterCriticality === c ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filterCriticality === c ? 'transparent' : 'var(--border-soft)'}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {selectedRowIds.length > 0 && (
          <button
            onClick={() => alert(`Including ${selectedRowIds.length} defects in next block plan solver run...`)}
            className="btn-primary"
            style={{ fontSize: 12 }}
          >
            <Layers size={13} />
            Include {selectedRowIds.length} Selected in Plan
          </button>
        )}
      </div>

      {/* Data table */}
      <div className="warm-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="warm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 14px', width: 40, textAlign: 'center' }}>
                <input type="checkbox"
                  onChange={(e) => { if (e.target.checked) setSelectedRowIds(filteredDefects.map(d => d.id)); else setSelectedRowIds([]); }}
                />
              </th>
              {['DEFECT ID', 'SOURCE', 'DEPT', 'ASSET & LOCATION', 'CRITICALITY', 'PRIORITY SCORE', 'OVERDUE', 'STATUS'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', background: 'var(--bg-raised)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDefects.slice(0, 20).map((def) => (
              <tr
                key={def.id}
                style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-soft)', transition: 'background 0.12s' }}
                onClick={() => { setSelectedDefectId(def.id); setCurrentRoute('/defects/detail'); }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedRowIds.includes(def.id)} onChange={() => toggleSelectRow(def.id)} />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)', fontSize: 12 }}>{def.id}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="chip chip-muted font-mono" style={{ fontSize: 10 }}>{def.source}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="chip" style={{ fontSize: 10, background: deptColor(def.department), color: '#fff', border: 'none' }}>
                    {def.department}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div className="font-mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{def.assetType}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{def.blockSection} · KM {def.kmPost}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={`chip ${critColor(def.criticality)}`} style={{ fontSize: 10 }}>{def.criticality}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13, width: 28 }}>{def.priorityScore}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                      <div style={{ height: '100%', width: `${def.priorityScore}%`, background: 'var(--amber-500)', borderRadius: 4 }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {def.daysOverdue > 0
                    ? <span className="font-mono chip chip-red" style={{ fontSize: 10 }}>{def.daysOverdue}d</span>
                    : <span className="font-mono chip chip-sage" style={{ fontSize: 10 }}>On time</span>
                  }
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="chip chip-sage font-mono" style={{ fontSize: 10 }}>{def.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
