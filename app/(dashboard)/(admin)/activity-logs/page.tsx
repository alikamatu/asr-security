'use client';

import { useState, useEffect } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load activity logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (item) => {
        const d = new Date(item.createdAt);
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{formatDate(d.toISOString().split('T')[0])}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'module',
      label: 'Module',
      render: (item) => (
        <span className="badge" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
          {item.module}
        </span>
      ),
      sortable: true,
    },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'performedBy',
      label: 'Performed By',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500 }}>{item.performedBy}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.role}</div>
        </div>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Track all administrative actions performed within the system.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={32} className="animate-spin text-muted" />
          </div>
        ) : (
          <DataTable
            data={logs}
            columns={columns}
            searchFields={['action', 'module', 'description', 'performedBy']}
          />
        )}
      </div>
    </div>
  );
}
