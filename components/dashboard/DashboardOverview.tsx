'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Package,
  Lightbulb,
  PlayCircle,
  AlertTriangle,
  Shield,
  BookOpen,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { capitalize } from '@/lib/utils';
import type { DashboardStats, OBEntry } from '@/lib/types';

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitorsToday: 0,
    goodsReceivedToday: 0,
    tipsReceived: 0,
    playbackRequests: 0,
    pendingIncidents: 0,
    staffOnDuty: 0,
  });
  const [recentActivities, setRecentActivities] = useState<OBEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentActivities(data.recentActivities || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: 'Visitors Today',
      value: stats.totalVisitorsToday,
      icon: <Users size={20} />,
      color: '#3b82f6',
      subtitle: 'Total check-ins',
    },
    {
      label: 'Goods Received',
      value: stats.goodsReceivedToday,
      icon: <Package size={20} />,
      color: '#10b981',
      subtitle: 'Deliveries today',
    },
    {
      label: 'Tips Received',
      value: stats.tipsReceived,
      icon: <Lightbulb size={20} />,
      color: '#f59e0b',
      subtitle: 'Intelligence reports',
    },
    {
      label: 'Playback Requests',
      value: stats.playbackRequests,
      icon: <PlayCircle size={20} />,
      color: '#8b5cf6',
      subtitle: 'CCTV footage',
    },
    {
      label: 'Pending Incidents',
      value: stats.pendingIncidents,
      icon: <AlertTriangle size={20} />,
      color: '#ef4444',
      subtitle: 'Requires attention',
    },
    {
      label: 'Staff On Duty',
      value: stats.staffOnDuty,
      icon: <Shield size={20} />,
      color: '#06b6d4',
      subtitle: 'Active officers',
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visitor': return <Users size={14} />;
      case 'goods':
      case 'delivery': return <Package size={14} />;
      case 'tip': return <Lightbulb size={14} />;
      case 'playback': return <PlayCircle size={14} />;
      case 'incident': return <AlertTriangle size={14} />;
      case 'shift': return <Clock size={14} />;
      case 'patrol': return <Shield size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Control Room Overview — {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-success)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            System Online
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats stagger-children" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Activities */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'var(--color-text-heading)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
              Recent Activities
            </h2>
            <a
              href="/operations/occurrence-book"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View All →
            </a>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: 44, width: '100%' }} />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 2rem' }}>
              <BookOpen size={40} />
              <h3>No activities yet</h3>
              <p style={{ fontSize: '0.875rem' }}>
                Activities will appear here as they are logged throughout the day.
              </p>
            </div>
          ) : (
            <div className="timeline">
              {recentActivities.slice(0, 10).map((activity, index) => (
                <div
                  key={activity._id || index}
                  className={`timeline-item ${
                    activity.priority === 'critical' ? 'priority-critical' :
                    activity.priority === 'high' ? 'priority-high' : ''
                  }`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span className="timeline-time">{activity.time}</span>
                    <span
                      className="badge badge-accent"
                      style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem' }}
                    >
                      {getCategoryIcon(activity.category)}
                      {capitalize(activity.category)}
                    </span>
                    {activity.priority !== 'low' && (
                      <StatusBadge status={activity.priority} size="sm" />
                    )}
                  </div>
                  <div className="timeline-content">
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-primary)',
                        margin: '0.25rem 0 0',
                      }}
                    >
                      {activity.entry}
                    </p>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.125rem',
                      }}
                    >
                      — {activity.officer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            color: 'var(--color-text-heading)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} />
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/operations/visitors" className="btn btn-secondary">
            <Users size={16} /> Register Visitor
          </a>
          <a href="/operations/goods" className="btn btn-secondary">
            <Package size={16} /> Log Goods
          </a>
          <a href="/operations/incidents" className="btn btn-secondary">
            <AlertTriangle size={16} /> Report Incident
          </a>
          <a href="/operations/tips" className="btn btn-secondary">
            <Lightbulb size={16} /> Record Tip
          </a>
          <a href="/operations/occurrence-book" className="btn btn-secondary">
            <BookOpen size={16} /> OB Entry
          </a>
        </div>
      </div>
    </div>
  );
}
