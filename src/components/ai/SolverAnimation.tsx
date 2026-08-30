import React, { useState, useEffect, useRef } from 'react';
import { Layers, Cpu, CheckCircle2, ArrowRight, Zap, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import type { ApiPlan } from '../../lib/api';

interface SolverAnimationProps {
  onGenerate: () => Promise<ApiPlan>;
  onComplete: (plan: ApiPlan) => void;
}

export const SolverAnimation: React.FC<SolverAnimationProps> = ({ onGenerate, onComplete }) => {
  const [stage, setStage] = useState<number>(0);
  const [defectCount, setDefectCount] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0.0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [plan, setPlan] = useState<ApiPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiCalled = useRef(false);

  // Start the timer
  useEffect(() => {
    const timerSec = setInterval(() => { setElapsedSec((prev) => +(prev + 0.1).toFixed(1)); }, 100);
    return () => clearInterval(timerSec);
  }, []);

  // Animate stage 0: defect ingestion counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDefectCount((prev) => {
        if (prev >= 290) { clearInterval(timer); setStage(1); return 290; }
        return prev + 15;
      });
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Fire the real API call at stage 1 and animate through stages while waiting
  useEffect(() => {
    if (stage === 1 && !apiCalled.current) {
      apiCalled.current = true;

      // Animate through stages visually while the API works
      const t2 = setTimeout(() => setStage(2), 1500);
      const t3 = setTimeout(() => setStage(3), 3000);
      const t4 = setTimeout(() => setStage(4), 5000);

      // Call the real backend
      onGenerate()
        .then((result) => {
          setPlan(result);
          setStage(5);
          setIsFinished(true);
        })
        .catch((err) => {
          setError(err.message || 'AI Engine failed');
          setIsFinished(true);
        });

      return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [stage]);

  const stageItems = [
    { icon: RefreshCw, label: 'Stage 1: Ingesting Defects from TMS + SMMS + TDMS', sub: 'Parsing 3 siloed database feeds over CSTM–PUNE corridor', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13 }}>{defectCount} / 290 Defects</span> },
    { icon: BarChart2, label: 'Stage 2: Scoring Defect Criticality (XGBoost Model)', sub: 'Computing priority scores based on speed restrictions, traffic & age', right: <div style={{ display: 'flex', gap: 6 }}><span className="chip chip-red" style={{ fontSize: 10 }}>Critical</span><span className="chip chip-amber" style={{ fontSize: 10 }}>High</span></div> },
    { icon: Zap, label: 'Stage 3: Forecasting Train-Free Windows (COA / NTES)', sub: 'Extracting quiet freight & passenger gaps across 6 block sections', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-eng)', fontSize: 13 }}>Windows</span> },
    { icon: Cpu, label: 'Stage 4: Optimising Schedule (Google OR-Tools CP-SAT)', sub: 'Maximising Asset Availability Index subject to safety constraints', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-700)', fontSize: 13 }}>Solving...</span> },
    { icon: Layers, label: 'Stage 5: Clustering Combined Blocks (DBSCAN)', sub: 'Grouping adjacent cross-department maintenance tasks', right: <span className="font-mono" style={{ fontWeight: 700, color: 'var(--rail-snt)', fontSize: 13 }}>Clustering</span> },
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
              RailSync AI Engine — Real OR-Tools CP-SAT Solver
            </h2>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--amber-700)', margin: 0 }}>
              {!isFinished ? 'Running constraint optimization on backend...' : error ? 'Engine error' : 'Optimization complete'}
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
                  {isDone ? <CheckCircle2 size={16} color="var(--rail-snt)" /> : <Icon size={15} color={isActive ? 'var(--amber-700)' : 'var(--text-muted)'} />}
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

      {/* Error state */}
      {error && (
        <div className="anim-fade-up" style={{ marginTop: 20, background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} color="#DC2626" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#DC2626' }}>AI Engine Error: {error}</span>
          </div>
        </div>
      )}

      {/* Completion card — real data from backend */}
      {isFinished && plan && (
        <div className="anim-fade-up" style={{ marginTop: 20, background: 'var(--sage-bg)', border: '2px solid var(--sage-border)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={20} color="var(--rail-snt)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--sage-text)' }}>AI Block Plan Generated Successfully!</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              ['Tasks Scheduled', `${plan.tasks_scheduled || 0}`, 'var(--text-primary)'],
              ['Combined Blocks', `${plan.combined_blocks || 0}`, 'var(--amber-700)'],
              ['Solver Time', `${((plan.solver_time_ms || 0) / 1000).toFixed(1)}s`, 'var(--rail-snt)'],
              ['AAI Impact', `${plan.aai_before?.toFixed(1)}% → ${plan.aai_after?.toFixed(1)}%`, 'var(--rail-eng)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{l}</span>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>

          {/* OR-Tools stats */}
          <div className="font-mono" style={{ background: '#fff', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--amber-700)' }}>OR-Tools CP-SAT Stats:</strong>{' '}
            Objective Score: {plan.objective_score?.toFixed(1)} ·
            Conflicts Resolved: {plan.conflicts_resolved} ·
            Total Blocks: {plan.blocks.length} ·
            Engine: {plan.generated_by}
          </div>

          <button onClick={() => onComplete(plan)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
            View Generated Plan in Gantt Timeline
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
