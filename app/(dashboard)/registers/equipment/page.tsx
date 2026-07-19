'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, RefreshCcw, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV, capitalize } from '@/lib/utils';
import type { EquipmentEntry } from '@/lib/types';

export default function EquipmentPage() {
  const [entries, setEntries] = useState<EquipmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('good');
  const [processing, setProcessing] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/equipment`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: EquipmentEntry) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleReturn = async () => {
    if (!selectedId) return;
    setProcessing(true);
    
    try {
      const res = await fetch(`/api/equipment/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'return',
          conditionOnReturn: returnCondition
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => prev.map(e => e._id === selectedId ? data.equipment : e));
        setReturnModalOpen(false);
        setSelectedId(null);
      } else {
        alert('Failed to process return');
      }
    } catch (error) {
      console.error('Return error', error);
    } finally {
      setProcessing(false);
    }
  };

  const openReturnModal = (id: string, currentCondition: string) => {
    setSelectedId(id);
    setReturnCondition(currentCondition || 'good');
    setReturnModalOpen(true);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        'Date Issued': e.dateIssued,
        'Time Issued': e.timeIssued,
        'Time Returned': e.timeReturned || '-',
        Item: e.itemName,
        'Serial No.': e.serialNumber,
        'Issued To': e.issuedTo,
        Department: e.department,
        Status: capitalize(e.status),
        'Issue Cond.': capitalize(e.conditionOnIssue),
        'Return Cond.': e.conditionOnReturn ? capitalize(e.conditionOnReturn) : '-',
        'Issued By': e.issuedBy,
        'Returned To': e.returnedTo || '-'
      })),
      `Equipment_Log`
    );
  };

  const columns: Column<EquipmentEntry>[] = [
    { key: 'itemName', label: 'Item Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{item.itemName}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          SN: {item.serialNumber}
        </div>
      </div>
    ), sortable: true },
    { key: 'issuedTo', label: 'Issued To', render: (item) => (
      <div>
        <div>{item.issuedTo}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.department}</div>
      </div>
    ), sortable: true },
    { key: 'dateIssued', label: 'Issued On', render: (item) => (
      <div>
        <div>{formatDate(item.dateIssued)} {item.timeIssued}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>By: {item.issuedBy}</div>
      </div>
    ), sortable: true },
    { key: 'timeReturned', label: 'Returned On', render: (item) => (
      item.timeReturned ? (
        <div>
          <div style={{ color: 'var(--color-success)' }}>{item.timeReturned}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>To: {item.returnedTo}</div>
        </div>
      ) : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Pending</span>
      )
    ), sortable: true },
    { key: 'status', label: 'Status / Condition', render: (item) => (
      <div>
        <StatusBadge status={item.status === 'issued' ? 'open' : 'closed'} size="sm" />
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {capitalize(item.status === 'issued' ? item.conditionOnIssue : (item.conditionOnReturn || ''))}
        </div>
      </div>
    ), sortable: true },
    { key: 'actions', label: 'Actions', render: (item) => (
      item.status === 'issued' ? (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { e.stopPropagation(); openReturnModal(item._id!, item.conditionOnIssue); }}
          style={{ color: 'var(--color-accent)' }}
        >
          <RefreshCcw size={14} /> Return
        </button>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
          <CheckCircle2 size={14} /> Returned
        </span>
      )
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Register</h1>
          <p className="page-subtitle">Manage issuance and return of radios, keys, and security gear.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Issue Equipment
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
            searchFields={['itemName', 'serialNumber', 'issuedTo', 'department', 'purpose']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Issue Equipment"
        size="lg"
      >
        <EquipmentForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Return Equipment"
        size="sm"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Condition on Return</label>
            <select 
              className="form-select" 
              value={returnCondition} 
              onChange={(e) => setReturnCondition(e.target.value)}
            >
              <option value="good">Good / Fully Functional</option>
              <option value="fair">Fair / Minor wear</option>
              <option value="damaged">Damaged / Needs Repair</option>
              <option value="missing">Parts Missing</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setReturnModalOpen(false)} disabled={processing}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleReturn} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
