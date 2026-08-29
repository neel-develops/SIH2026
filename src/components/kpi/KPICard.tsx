import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  accentColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  delta,
  deltaType = 'positive',
  icon: Icon,
  accentColor = '#1D4ED8'
}) => {
  return (
    <div
      className="warm-card"
      style={{ padding: '18px 20px', borderLeft: `4px solid ${accentColor}`, cursor: 'default' }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3,
          maxWidth: '75%',
        }}>
          {title}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="font-mono" style={{
          fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
        {delta && (
          <span
            className={
              deltaType === 'positive' ? 'chip chip-sage' :
              deltaType === 'negative' ? 'chip chip-red' :
              'chip chip-muted'
            }
            style={{ fontSize: 10 }}
          >
            {delta}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
