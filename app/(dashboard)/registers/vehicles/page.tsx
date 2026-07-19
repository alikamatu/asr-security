'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, LogOut, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import VehicleForm from '@/components/vehicles/VehicleForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { exportToCSV, capitalize } from '@/lib/utils';
import type { VehicleEntry } from '@/lib/types';

export default function VehiclesPage() {
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: VehicleEntry) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleCheckout = async (id: string) => {
    if (!confirm('Are you sure you want to mark this vehicle as departed?')) return;
    
    setCheckingOut(id);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => prev.map(e => e._id === id ? data.vehicle : e));
      } else {
        alert('Failed to checkout vehicle');
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
        Registration: e.registrationNumber,
        Type: e.vehicleType,
        Driver: e.driverName,
        Company: e.company || 'N/A',
        Purpose: e.purpose,
        Destination: e.destination,
        Status: capitalize(e.status),
        Officer: e.officer
      })),
      `Vehicle_Register`
    );
  };

  const columns: Column<VehicleEntry>[] = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'registrationNumber', label: 'Vehicle Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{item.registrationNumber}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.vehicleType}</div>
      </div>
    ), sortable: true },
    { key: 'driverName', label: 'Driver / Company', render: (item) => (
      <div>
        <div>{item.driverName}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.company || '-'}</div>
      </div>
    ), sortable: true },
    { key: 'purpose', label: 'Purpose / Dest.', render: (item) => (
      <div>
        <div>{item.purpose}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.destination}</div>
      </div>
    ), sortable: true },
    { key: 'timeIn', label: 'Time In/Out', render: (item) => (
      <div>
        <div style={{ color: 'var(--color-success)' }}>In: {item.timeIn}</div>
        {item.timeOut && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Out: {item.timeOut}</div>}
      </div>
    ), sortable: true },
    { key: 'status', label: 'Status', render: (item) => (
      <StatusBadge status={item.status === 'on-premises' ? 'inside' : 'checked-out'} size="sm" />
    ), sortable: true },
    { key: 'actions', label: 'Actions', render: (item) => (
      item.status === 'on-premises' ? (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { e.stopPropagation(); handleCheckout(item._id!); }}
          disabled={checkingOut === item._id}
          style={{ color: 'var(--color-warning)' }}
        >
          {checkingOut === item._id ? 'Processing...' : <><LogOut size={14} /> Depart</>}
        </button>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
          <CheckCircle2 size={14} /> Departed
        </span>
      )
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Register</h1>
          <p className="page-subtitle">Track all vehicles entering and leaving the premises.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Register Vehicle
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
            searchFields={['registrationNumber', 'driverName', 'company', 'purpose', 'destination']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Register Vehicle Entry"
        size="lg"
      >
        <VehicleForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
