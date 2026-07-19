'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, Lightbulb } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import TipForm from '@/components/tips/TipForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV, capitalize } from '@/lib/utils';
import type { Tip } from '@/lib/types';

export default function TipsPage() {
  const [entries, setEntries] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tips`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch tips', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: Tip) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Time: e.time,
        Source: capitalize(e.source),
        Category: capitalize(e.tipCategory),
        Priority: capitalize(e.priority),
        Location: e.location,
        Description: e.description,
        'Assigned To': e.assignedTo || 'Unassigned',
        Status: capitalize(e.status),
        'Recording Officer': e.officerRecording
      })),
      `Tips_Register`
    );
  };

  const columns: Column<Tip>[] = [
    { key: 'date', label: 'Date', render: (item) => `${formatDate(item.date)} ${item.time}`, sortable: true },
    { key: 'tipCategory', label: 'Category & Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{capitalize(item.tipCategory)}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </div>
      </div>
    ), sortable: true },
    { key: 'source', label: 'Source', render: (item) => capitalize(item.source), sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'priority', label: 'Priority', render: (item) => <StatusBadge status={item.priority} size="sm" />, sortable: true },
    { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} size="sm" />, sortable: true },
    { key: 'assignedTo', label: 'Assigned To', render: (item) => item.assignedTo || <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>, sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tips Received</h1>
          <p className="page-subtitle">Confidential intelligence, reports, and observations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Record Tip
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading entries...
          </div>
        ) : (
          <DataTable
            data={entries}
            columns={columns}
            searchFields={['tipCategory', 'location', 'description', 'source', 'assignedTo']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Record Confidential Tip"
        size="lg"
      >
        <TipForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
