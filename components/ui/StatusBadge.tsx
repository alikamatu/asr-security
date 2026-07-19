'use client';

import { capitalize } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, string> = {
  // Visitor
  'inside': 'badge-info',
  'checked-out': 'badge-success',
  // Tip / Incident
  'open': 'badge-warning',
  'investigating': 'badge-info',
  'resolved': 'badge-success',
  'closed': 'badge-muted',
  // Goods condition
  'good': 'badge-success',
  'damaged': 'badge-danger',
  'fair': 'badge-warning',
  'poor': 'badge-danger',
  'out-of-service': 'badge-danger',
  // Priority
  'low': 'badge-success',
  'medium': 'badge-warning',
  'high': 'badge-danger',
  'critical': 'badge-danger',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const badgeClass = STATUS_MAP[status] || 'badge-muted';
  const fontSize = size === 'sm' ? '0.6875rem' : undefined;
  const padding = size === 'sm' ? '0.125rem 0.5rem' : undefined;

  return (
    <span className={`badge ${badgeClass}`} style={{ fontSize, padding }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          display: 'inline-block',
        }}
      />
      {capitalize(status)}
    </span>
  );
}
