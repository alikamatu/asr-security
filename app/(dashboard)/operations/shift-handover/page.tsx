'use client';

import { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import HandoverForm from '@/components/shift/HandoverForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV, capitalize } from '@/lib/utils';
import type { ShiftHandover } from '@/lib/types';

export default function ShiftHandoverPage() {
  const [entries, setEntries] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shift-handover`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch handovers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: ShiftHandover) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Shift: capitalize(e.shift),
        'Outgoing Officer': e.outgoingOfficer,
        'Incoming Officer': e.incomingOfficer,
        'Visitors Inside': e.visitorsStillInside,
        'Goods Pending': e.goodsPendingCollection,
        'Equipment Status': e.equipmentStatus,
        'Patrol Notes': e.patrolNotes,
        'Outstanding Issues': e.outstandingIssues
      })),
      `Shift_Handover_Log`
    );
  };

  const columns: Column<ShiftHandover>[] = [
    { key: 'date', label: 'Date', render: (item) => formatDate(item.date), sortable: true },
    { key: 'shift', label: 'Shift', render: (item) => (
      <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
        {capitalize(item.shift)}
      </span>
    ), sortable: true },
    { key: 'outgoingOfficer', label: 'Handover details', render: (item) => (
      <div>
        <div style={{ fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>From: </span>
          <span style={{ fontWeight: 600 }}>{item.outgoingOfficer}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>To: </span>
          <span style={{ fontWeight: 600 }}>{item.incomingOfficer}</span>
        </div>
      </div>
    ), sortable: true },
    { key: 'stats', label: 'Pending Items', render: (item) => (
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <div>Visitors Inside: <strong>{item.visitorsStillInside}</strong></div>
        <div>Goods Pending: <strong>{item.goodsPendingCollection}</strong></div>
      </div>
    )},
    { key: 'outstandingIssues', label: 'Remarks / Issues', render: (item) => (
      <div style={{ fontSize: '0.8125rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.outstandingIssues}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shift Handover</h1>
          <p className="page-subtitle">Formal handover records between outgoing and incoming security shifts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Handover
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
            searchFields={['outgoingOfficer', 'incomingOfficer', 'shift', 'outstandingIssues']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Shift Handover Record"
        size="lg"
      >
        <HandoverForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
