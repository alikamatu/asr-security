'use client';

import { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GoodsForm from '@/components/goods/GoodsForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV } from '@/lib/utils';
import type { GoodsEntry } from '@/lib/types';

export default function GoodsPage() {
  const [entries, setEntries] = useState<GoodsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goods`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch goods entries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: GoodsEntry) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Time: e.time,
        Item: e.itemDescription,
        Quantity: e.quantity,
        Supplier: e.supplier,
        Department: e.departmentReceiving,
        Condition: e.condition,
        Officer: e.securityOfficer
      })),
      `Received_Goods`
    );
  };

  const columns: Column<GoodsEntry>[] = [
    { key: 'date', label: 'Date', render: (item) => `${formatDate(item.date)} ${item.time}`, sortable: true },
    { key: 'itemDescription', label: 'Item / Qty', render: (item) => (
      <div>
        <div style={{ fontWeight: 500 }}>{item.itemDescription}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</div>
      </div>
    ), sortable: true },
    { key: 'supplier', label: 'Supplier / Delivery', render: (item) => (
      <div>
        <div>{item.supplier}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>By: {item.deliveryCompany}</div>
      </div>
    ), sortable: true },
    { key: 'departmentReceiving', label: 'Destination', render: (item) => (
      <div>
        <div>{item.departmentReceiving}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>To: {item.receivedBy}</div>
      </div>
    ), sortable: true },
    { key: 'deliveryNoteNumber', label: 'Ref No.', sortable: true },
    { key: 'condition', label: 'Condition', render: (item) => <StatusBadge status={item.condition} size="sm" />, sortable: true },
    { key: 'securityOfficer', label: 'Officer', sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Received Goods</h1>
          <p className="page-subtitle">Log of all deliveries and goods received at the premises.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Goods
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
            searchFields={['itemDescription', 'supplier', 'deliveryCompany', 'departmentReceiving', 'deliveryNoteNumber']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Log Received Goods"
        size="lg"
      >
        <GoodsForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
