'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, UserCheck, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import LostFoundForm from '@/components/lost-found/LostFoundForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV, capitalize } from '@/lib/utils';
import type { LostFoundEntry } from '@/lib/types';

export default function LostFoundPage() {
  const [entries, setEntries] = useState<LostFoundEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Claim form state
  const [claimedBy, setClaimedBy] = useState('');
  const [claimantId, setClaimantId] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lost-found`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch lost and found', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: LostFoundEntry) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setProcessing(true);
    
    try {
      const res = await fetch(`/api/lost-found/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'claim',
          claimedBy,
          claimantId,
          claimantPhone
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => prev.map(e => e._id === selectedId ? data.item : e));
        setClaimModalOpen(false);
        resetClaimForm();
      } else {
        alert('Failed to process claim');
      }
    } catch (error) {
      console.error('Claim error', error);
    } finally {
      setProcessing(false);
    }
  };

  const openClaimModal = (id: string) => {
    setSelectedId(id);
    resetClaimForm();
    setClaimModalOpen(true);
  };

  const resetClaimForm = () => {
    setClaimedBy('');
    setClaimantId('');
    setClaimantPhone('');
    setSelectedId(null);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        'Date Found': e.dateFound,
        'Time Found': e.timeFound,
        Item: e.itemDescription,
        Category: capitalize(e.category),
        Location: e.locationFound,
        'Found By': e.foundBy,
        Storage: e.storageLocation,
        Status: capitalize(e.status),
        'Claimed By': e.claimedBy || '-',
        'Claim Date': e.dateClaimed || '-',
        'Rec. Officer': e.receivingOfficer
      })),
      `Lost_and_Found_Register`
    );
  };

  const columns: Column<LostFoundEntry>[] = [
    { key: 'dateFound', label: 'Date/Time Found', render: (item) => `${formatDate(item.dateFound)} ${item.timeFound}`, sortable: true },
    { key: 'itemDescription', label: 'Item Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{item.itemDescription}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {capitalize(item.category)} • {item.storageLocation}
        </div>
      </div>
    ), sortable: true },
    { key: 'locationFound', label: 'Location Found', sortable: true },
    { key: 'foundBy', label: 'Found By', render: (item) => (
      <div>
        <div>{item.foundBy}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.finderContact || '-'}</div>
      </div>
    ), sortable: true },
    { key: 'status', label: 'Status', render: (item) => (
      item.status === 'unclaimed' ? (
        <StatusBadge status="open" size="sm" />
      ) : (
        <div>
          <StatusBadge status="closed" size="sm" />
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {item.dateClaimed}
          </div>
        </div>
      )
    ), sortable: true },
    { key: 'actions', label: 'Actions', render: (item) => (
      item.status === 'unclaimed' ? (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { e.stopPropagation(); openClaimModal(item._id!); }}
          style={{ color: 'var(--color-success)' }}
        >
          <UserCheck size={14} /> Process Claim
        </button>
      ) : (
        <div style={{ fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)' }}>
            <CheckCircle2 size={14} /> Claimed By:
          </div>
          <div style={{ fontWeight: 500 }}>{item.claimedBy}</div>
        </div>
      )
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lost & Found</h1>
          <p className="page-subtitle">Track items found on premises and manage their return to owners.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Found Item
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
            searchFields={['itemDescription', 'locationFound', 'foundBy', 'claimedBy']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Log Found Item"
        size="lg"
      >
        <LostFoundForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Process Item Claim"
        size="md"
      >
        <form onSubmit={handleClaim} style={{ padding: '0.5rem 0' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Claimant Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={claimedBy} 
              onChange={(e) => setClaimedBy(e.target.value)}
              required
            />
          </div>
          <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">ID Verification (Type/Number)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. National ID 1234..."
                value={claimantId} 
                onChange={(e) => setClaimantId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input 
                type="tel" 
                className="form-input" 
                value={claimantPhone} 
                onChange={(e) => setClaimantPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setClaimModalOpen(false)} disabled={processing}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Handover'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
