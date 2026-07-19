'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, LogOut, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import VisitorForm from '@/components/visitors/VisitorForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { exportToCSV, capitalize } from '@/lib/utils';
import type { Visitor } from '@/lib/types';

export default function VisitorsPage() {
  const [entries, setEntries] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visitors`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch visitors', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: Visitor) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleCheckout = async (id: string) => {
    if (!confirm('Are you sure you want to check out this visitor?')) return;
    
    setCheckingOut(id);
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => prev.map(e => e._id === id ? data.visitor : e));
      } else {
        alert('Failed to checkout visitor');
      }
    } catch (error) {
      console.error('Checkout error', error);
    } finally {
      setCheckingOut(null);
    }
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        'Time In': e.timeIn,
        'Time Out': e.timeOut || '-',
        Name: e.visitorName,
        Phone: e.phoneNumber,
        Company: e.company,
        'Visiting': e.personVisiting,
        Department: e.department,
        Status: capitalize(e.status),
        Pass: e.visitorPassNumber,
        Officer: e.securityOfficer
      })),
      `Visitor_Register`
    );
  };

  const columns: Column<Visitor>[] = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'visitorName', label: 'Visitor Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{item.visitorName}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {item.phoneNumber} {item.company ? `• ${item.company}` : ''}
        </div>
      </div>
    ), sortable: true },
    { key: 'personVisiting', label: 'Host / Dept', render: (item) => (
      <div>
        <div>{item.personVisiting}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.department}</div>
      </div>
    ), sortable: true },
    { key: 'timeIn', label: 'Time In/Out', render: (item) => (
      <div>
        <div style={{ color: 'var(--color-success)' }}>In: {item.timeIn}</div>
        {item.timeOut && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Out: {item.timeOut}</div>}
      </div>
    ), sortable: true },
    { key: 'visitorPassNumber', label: 'Pass No.', sortable: true },
    { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} size="sm" />, sortable: true },
    { key: 'actions', label: 'Actions', render: (item) => (
      item.status === 'inside' ? (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { e.stopPropagation(); handleCheckout(item._id!); }}
          disabled={checkingOut === item._id}
          style={{ color: 'var(--color-warning)' }}
        >
          {checkingOut === item._id ? 'Processing...' : <><LogOut size={14} /> Check Out</>}
        </button>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
          <CheckCircle2 size={14} /> Completed
        </span>
      )
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Day Visitors Register</h1>
          <p className="page-subtitle">Track all non-resident visitors entering and leaving the premises.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Register Visitor
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
            searchFields={['visitorName', 'company', 'personVisiting', 'visitorPassNumber', 'phoneNumber']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Register New Visitor"
        size="lg"
      >
        <VisitorForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
