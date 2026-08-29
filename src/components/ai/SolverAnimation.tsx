import React, { useState, useEffect } from 'react';
import { Layers, Cpu, CheckCircle2, ArrowRight, Zap, RefreshCw, BarChart2 } from 'lucide-react';
import { BlockPlan } from '../../types';

interface SolverAnimationProps {
  onComplete: (plan: BlockPlan) => void;
}

export const SolverAnimation: React.FC<SolverAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);
  const [defectCount, setDefectCount] = useState<number>(0);
  const [objectiveVal, setObjectiveVal] = useState<number>(100);
  const [elapsedSec, setElapsedSec] = useState<number>(0.0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    const timer1 = setInterval(() => {
      setDefectCount((prev) => {
        if (prev >= 290) { clearInterval(timer1); setStage(1); return 290; }
        return prev + 15;
      });
    }, 100);
    const timerSec = setInterval(() => { setElapsedSec((prev) => +(prev + 0.1).toFixed(1)); }, 100);
    return () => { clearInterval(timer1); clearInterval(timerSec); };
  }, []);

  useEffect(() => {
    if (stage === 1) { const t = setTimeout(() => setStage(2), 2500); return () => clearTimeout(t); }
    else if (stage === 2) { const t = setTimeout(() => setStage(3), 2500); return () => clearTimeout(t); }
    else if (stage === 3) {
      const interval = setInterval(() => {
        setObjectiveVal((prev) => { if (prev >= 982) { clearInterval(interval); setStage(4); return 982; } return prev + 45; });
      }, 150);
      return () => clearInterval(interval);
    } else if (stage === 4) {
      const t = setTimeout(() => { setStage(5); setIsFinished(true); }, 2000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const mockGeneratedPlan: BlockPlan = {
    id: `BLK-2026-WK14-${Math.floor(Math.random() * 900) + 100}`,
    horizon: 'WEEKLY', sectionId: 'CSTM-PUNE',
    generatedAt: new Date().toISOString(), solveTimeSec: elapsedSec,
    status: 'PENDING_APPROVAL',
    metrics: { defectsScheduled: 54, defectsTotal: 58, combinedBlockRatePct: 46, downtimeReductionPct: 39, utilisationPct: 89, projectedAAI: 91.8 },
    approvals: [],
    blocks: [{
      id: 'BLK-2026-0401-01', planId: 'BLK-2026-WK14', blockType: 'COMBINED',
      departments: ['ENG', 'SNT', 'TD'], blockSection: 'KYN-KSRA',
      kmFrom: 54.0, kmTo: 72.0,
      start: new Date(Date.now() + 86400000).toISOString(),
      end: new Date(Date.now() + 86400000 + 12600000).toISOString(),
      defectIds: ['TMS-2026-4010', 'SMMS-2026-4011', 'TDMS-2026-4012'],
      status: 'PENDING_APPROVAL', utilisationPct: 95, aiConfidence: 0.98,
      aiRationale: 'Google OR-Tools CP-SAT Solver clustered 3 cross-department defects in 18 km during 3.5h night freight gap.',
      manuallyOverridden: false
    }]
  };

  const stageItems = [
    { icon: RefreshCw, label: 'Stage 1: Ingesting Defects from TMS + SMMS + TDMS', sub: 'Parsing 3 siloed database feeds over CSTM–PUNE corridor', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13 }}>{defectCount} / 290 Defects</span>, animate: 'spin' },
    { icon: BarChart2, label: 'Stage 2: Scoring Defect Criticality (XGBoost ML Model)', sub: 'Computing priority scores based on speed restrictions, traffic & age', right: <div style={{ display: 'flex', gap: 6 }}><span className="chip chip-red" style={{ fontSize: 10 }}>25 Critical</span><span className="chip chip-amber" style={{ fontSize: 10 }}>55 High</span></div>, animate: 'bounce' },
    { icon: Zap, label: 'Stage 3: Forecasting Train-Free Windows (COA / NTES Timetable)', sub: 'Extracting quiet freight & passenger gaps across 6 block sections', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)', fontSize: 13 }}>30 Windows</span>, animate: 'pulse' },
    { icon: Cpu, label: 'Stage 4: Optimising Schedule (Google OR-Tools CP-SAT)', sub: 'Maximising Asset Availability Index (AAI) subject to safety rules', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13 }}>Obj: {objectiveVal}</span>, animate: 'spin' },
    { icon: Layers, label: 'Stage 5: Clustering Combined Blocks (DBSCAN Spatial Algorithm)', sub: 'Grouping adjacent ENG + S&T + TD maintenance tasks', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-snt)', fontSize: 13 }}>12 Clusters</span>, animate: '' },
  ];

  return (
    <div className="warm-card" style={{ padding: '28px 32px', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--amber-100)', border: '2px solid var(--amber-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={22} color="var(--amber-700)" style={{ animation: !isFinished ? 'spin 2s linear infinite' : 'none' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              AABPS AI Engine — Google OR-Tools CP-SAT
            </h2>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)', margin: 0 }}>
              Multi-Objective Constraint Programming & Cross-Department Clustering
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ELAPSED</span>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--rail-snt)' }}>{elapsedSec.toFixed(1)}s</span>
        </div>
      </div>

      {/* Stage tracker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stageItems.map(({ icon: Icon, label, sub, right }, idx) => {
          const isActive = stage === idx;
          const isDone = stage > idx;
          const isPending = stage < idx;
          return (
            <div key={idx} style={{
              padding: '12px 16px', borderRadius: 12,
              background: isPending ? 'var(--bg-raised)' : 'var(--bg-surface)',
              border: `1px solid ${isDone ? 'var(--border-mid)' : isActive ? 'var(--amber-300)' : 'var(--border-soft)'}`,
              opacity: isPending ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: isDone ? 'var(--sage-bg)' : isActive ? 'var(--amber-100)' : 'var(--bg-raised)', border: `1px solid ${isDone ? 'var(--sage-border)' : 'var(--border-soft)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isDone
                    ? <CheckCircle2 size={16} color="var(--rail-snt)" />
                    : <Icon size={15} color={isActive ? 'var(--amber-700)' : 'var(--text-muted)'} />
                  }
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>{right}</div>
            </div>
          );
        })}
      </div>

      {/* Completion card */}
      {isFinished && (
        <div className="anim-fade-up" style={{ marginTop: 20, background: 'var(--sage-bg)', border: '2px solid var(--sage-border)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={20} color="var(--rail-snt)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--sage-text)' }}>AI Block Plan Generated Successfully!</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              ['Scheduled Defects', '54 / 58', 'var(--text-primary)'],
              ['Combined Block Rate', '46% (+5x)', 'var(--amber-700)'],
              ['Downtime Reduction', '39%', 'var(--rail-snt)'],
              ['Projected AAI', '91.8%', 'var(--rail-eng)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{l}</span>
                <span className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onComplete(mockGeneratedPlan)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
            View Generated Plan in Gantt Timeline
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
