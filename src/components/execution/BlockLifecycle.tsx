import React from 'react';
import { CheckCircle2, Circle, PlayCircle, PauseCircle } from 'lucide-react';

export const LIFECYCLE_STAGES = ['SCHEDULED', 'IN_PROGRESS', 'PARTIALLY_DONE', 'COMPLETED'] as const;

export const STAGE_LABEL: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'Work In Progress',
  PARTIALLY_DONE: 'Partially Done',
  COMPLETED: 'Completed',
};

export const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'var(--text-muted)',
  IN_PROGRESS: 'var(--amber-700)',
  PARTIALLY_DONE: 'var(--rail-td)',
  COMPLETED: 'var(--rail-snt)',
  OVERRIDDEN: 'var(--amber-500)',
};

export const STATUS_CHIP: Record<string, string> = {
  SCHEDULED: 'chip-muted',
  IN_PROGRESS: 'chip-amber',
  PARTIALLY_DONE: 'chip-amber',
  COMPLETED: 'chip-sage',
  OVERRIDDEN: 'chip-amber',
};

/** Format a duration in hours as `2h 45m`. */
export function fmtHrs(hours: number): string {
  const totalMin = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

interface LifecycleTrackerProps {
  status: string;
  /** PARTIALLY_DONE is a terminal branch, not a step on the way to COMPLETED. */
  compact?: boolean;
}

/**
 * Visual state machine for a block:
 *   SCHEDULED → IN_PROGRESS → PARTIALLY_DONE → COMPLETED
 * A partially-done block is rendered as a branch, because its outstanding work
 * moves to a *different* block via AI carry-forward rather than completing here.
 */
export const LifecycleTracker: React.FC<LifecycleTrackerProps> = ({ status, compact }) => {
  const order = ['SCHEDULED', 'IN_PROGRESS', 'PARTIALLY_DONE', 'COMPLETED'];
  const currentIdx = order.indexOf(status);

  const iconFor = (stage: string, state: 'done' | 'active' | 'todo') => {
    const size = compact ? 14 : 17;
    if (state === 'done') return <CheckCircle2 size={size} />;
    if (state === 'active') {
      if (stage === 'IN_PROGRESS') return <PlayCircle size={size} />;
      if (stage === 'PARTIALLY_DONE') return <PauseCircle size={size} />;
      return <CheckCircle2 size={size} />;
    }
    return <Circle size={size} />;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6, flexWrap: 'wrap' }}>
      {order.map((stage, i) => {
        let state: 'done' | 'active' | 'todo' = 'todo';
        if (i < currentIdx) state = 'done';
        else if (i === currentIdx) state = 'active';

        // A completed block never passed through PARTIALLY_DONE unless it was
        // explicitly recorded, so don't imply it did.
        if (status === 'COMPLETED' && stage === 'PARTIALLY_DONE') state = 'todo';

        const color =
          state === 'done' ? 'var(--rail-snt)'
            : state === 'active' ? STATUS_COLOR[stage] ?? 'var(--amber-700)'
              : 'var(--text-muted)';

        return (
          <React.Fragment key={stage}>
            {i > 0 && (
              <span style={{
                width: compact ? 10 : 18, height: 2, borderRadius: 1,
                background: i <= currentIdx ? 'var(--rail-snt)' : 'var(--border-soft)',
              }} />
            )}
            <div
              title={STAGE_LABEL[stage]}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color, opacity: state === 'todo' ? 0.45 : 1,
                fontWeight: state === 'active' ? 700 : 600,
              }}
            >
              {iconFor(stage, state)}
              {!compact && (
                <span className="font-mono" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                  {STAGE_LABEL[stage]}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface ProgressBarProps {
  pct: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  pct, color = 'var(--amber-700)', height = 8, showLabel,
}) => {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{
        flex: 1, height, borderRadius: height / 2,
        background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clamped}%`, height: '100%', background: color,
          borderRadius: height / 2, transition: 'width 0.4s ease',
        }} />
      </div>
      {showLabel && (
        <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color, minWidth: 34 }}>
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
