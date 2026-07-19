'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              marginBottom: '0.5rem',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--color-text-heading)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '0.75rem',
                color: color || 'var(--color-text-muted)',
                marginTop: '0.375rem',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--border-radius-sm)',
            background: color ? `${color}15` : 'var(--color-accent-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color || 'var(--color-accent)',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
