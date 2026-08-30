import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store/useStore';
import { ApiBlock } from '../lib/api';
import { Smartphone, CheckCircle2, PlusCircle, Play } from 'lucide-react';

export const FieldPWAView: React.FC = () => {
  const { currentUser, defects, plans, updateBlockStatus, setCurrentRoute } = useStore();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TASKS'>('TODAY');
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);

  // Get today's date string for comparison
  const todayStr = new Date().toISOString().slice(0, 10);

  // Find user's assigned sections
  const userSections = currentUser?.assigned_sections || [];

  // Find today's blocks from plans, filtered by user's sections
  const todaysBlocks = useMemo(() => {
    const blocks: (ApiBlock & { planId: string })[] = [];
    for (const plan of plans) {
      for (const block of plan.blocks) {
        const blockDate = block.scheduled_start?.slice(0, 10);
        const inSection = userSections.length === 0 || userSections.includes(block.section);
        if (blockDate === todayStr && inSection) {
          blocks.push({ ...block, planId: plan.id });
        }
      }
    }
    // If no blocks today, show upcoming blocks for user's sections
    if (blocks.length === 0) {
      for (const plan of plans) {
        for (const block of plan.blocks) {
          const inSection = userSections.length === 0 || userSections.includes(block.section);
          if (inSection && block.status !== 'COMPLETED') {
            blocks.push({ ...block, planId: plan.id });
          }
        }
      }
    }
    return blocks.slice(0, 5);
  }, [plans, userSections, todayStr]);

  // Filter defects by user's section
  const myTasks = useMemo(() => {
    if (userSections.length > 0) {
      return defects.filter((d) => userSections.includes(d.section)).slice(0, 6);
    }
    return defects.slice(0, 6);
  }, [defects, userSections]);

  const handleStartBlock = async (block: ApiBlock & { planId: string }) => {
    setUpdatingBlockId(block.id);
    try {
      await updateBlockStatus(block.planId, block.id, 'IN_PROGRESS', new Date().toISOString());
    } catch (err) {
      console.error('Failed to start block:', err);
    } finally {
      setUpdatingBlockId(null);
    }
  };

  const handleCompleteBlock = async (block: ApiBlock & { planId: string }) => {
    setUpdatingBlockId(block.id);
    try {
      await updateBlockStatus(block.planId, block.id, 'COMPLETED', undefined, new Date().toISOString());
    } catch (err) {
      console.error('Failed to complete block:', err);
    } finally {
      setUpdatingBlockId(null);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'TODAY', label: 'Today' },
    { id: 'TASKS', label: 'My Tasks' },
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
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{currentUser?.name || 'Field User'} ({currentUser?.role || 'N/A'})</div>
            </div>
          </div>
          <span className="chip font-mono" style={{
            fontSize: 10, fontWeight: 700,
            background: 'var(--rail-snt)',
            color: '#fff', border: 'none',
          }}>
            ONLINE
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
                {todaysBlocks.length > 0
                  ? `Today's Scheduled Blocks (${userSections[0] || 'All Sections'})`
                  : 'Upcoming Blocks'}
              </h3>
              {todaysBlocks.length === 0 && (
                <div className="warm-card" style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-muted)' }}>
                  No blocks scheduled for today in your assigned sections.
                </div>
              )}
              {todaysBlocks.map((block) => (
                <div key={block.id} className="warm-card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--amber-700)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13, display: 'block' }}>{block.id}</span>
                      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{block.section} · {block.department}</span>
                    </div>
                    {block.is_combined && (
                      <span className="chip chip-amber" style={{ fontSize: 10 }}>COMBINED BLOCK</span>
                    )}
                  </div>
                  <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12 }}>
                    <div className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      Time Window: <strong>{formatTime(block.scheduled_start)} – {formatTime(block.scheduled_end)} ({block.duration_hrs}h)</strong>
                    </div>
                    {block.is_combined && block.combined_departments && (
                      <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                        Departments: <strong>{block.combined_departments.join(' + ')}</strong>
                      </div>
                    )}
                    <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                      Defects: <strong>{block.defect_ids.length} task{block.defect_ids.length !== 1 ? 's' : ''}</strong>
                    </div>
                  </div>
                  {block.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => handleCompleteBlock(block)}
                      disabled={updatingBlockId === block.id}
                      className="btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 13, borderColor: 'var(--rail-snt)', color: 'var(--rail-snt)', opacity: updatingBlockId === block.id ? 0.6 : 1 }}
                    >
                      <CheckCircle2 size={15} /> Complete Block & Log Restoration
                    </button>
                  ) : block.status === 'COMPLETED' ? (
                    <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--rail-snt)', padding: '8px 0' }}>
                      Block Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartBlock(block)}
                      disabled={updatingBlockId === block.id}
                      className="btn-amber"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 13, opacity: updatingBlockId === block.id ? 0.6 : 1 }}
                    >
                      <Play size={14} /> Start Maintenance Block Work
                    </button>
                  )}
                </div>
              ))}
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
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 12 }}>KM {t.km_from}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{t.defect_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description || t.asset_type || 'No description'}</div>
                </div>
              ))}
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
