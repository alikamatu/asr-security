'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, CheckCircle, Filter } from 'lucide-react';
import Link from 'next/link';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import GoodsApprovalModal from '@/components/goods/GoodsApprovalModal';

import { formatDate, exportToCSV } from '@/lib/utils';
import type { GoodsEntry } from '@/lib/types';

type FilterType = 'All' | 'Recorded' | 'Approved';

export default function GoodsPage() {
  const [entries, setEntries] = useState<GoodsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterType>('All');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

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

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Time: e.time,
        Item: e.itemDescription,
        Quantity: e.quantity,
        Department: e.departmentReceiving,
        Officer: e.securityOfficer,
        Status: e.status || 'Recorded',
        ApprovedBy: e.approvedBy || 'N/A'
      })),
      `Received_Goods`
    );
  };

  const filteredEntries = entries.filter(e => {
    if (statusFilter === 'All') return true;
    const itemStatus = e.status || 'Recorded';
    return itemStatus === statusFilter;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only allow selecting 'Recorded' items for approval
      const recordIds = filteredEntries
        .filter(item => (item.status || 'Recorded') === 'Recorded' && item._id)
        .map(item => item._id as string);
      setSelectedIds(recordIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Determine if all selectable items are checked
  const selectableItems = filteredEntries.filter(item => (item.status || 'Recorded') === 'Recorded' && item._id);
  const allSelectableChecked = selectableItems.length > 0 && selectableItems.every(item => selectedIds.includes(item._id as string));

  const columns: Column<GoodsEntry>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allSelectableChecked}
          onChange={handleSelectAll}
          disabled={selectableItems.length === 0}
          title="Select all 'Recorded' items"
        />
      ),
      render: (item) => {
        const isRecorded = (item.status || 'Recorded') === 'Recorded';
        return isRecorded ? (
          <input
            type="checkbox"
            checked={!!item._id && selectedIds.includes(item._id)}
            onChange={(e) => item._id && handleSelectOne(item._id, e)}
          />
        ) : null;
      },
      sortable: false
    },
    {
      key: 'date', label: 'Date', render: (item) => (
        <div>
          <div style={{ fontSize: '0.5rem' }}>{formatDate(item.date)} {item.time}</div>
          <div style={{ marginTop: '2px' }}>
            <StatusBadge status={item.status || 'Recorded'} size="sm" />
            {item.status === 'Approved' && item.approvedBy && (
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                {item.approvedBy}
              </span>
            )}
          </div>
        </div>
      ), sortable: true
    },
    {
      key: 'itemDescription', label: 'Item / Qty', render: (item) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.7rem' }}>{item.itemDescription}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.quantity} {item.quantityUnit || 'pcs'}</div>
        </div>
      ), sortable: true
    },

    {
      key: 'departmentReceiving', label: 'Destination', className: 'hide-on-mobile', render: (item) => (
        <div>
          <div style={{ fontSize: '0.8125rem' }}>{item.departmentReceiving}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>To: {item.receivedBy}</div>
          {item.storesPersonName && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Stores: {item.storesPersonName}</div>
          )}
        </div>
      ), sortable: true
    },

    { key: 'securityOfficer', label: 'Officer', className: 'hide-on-mobile', sortable: true },
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
          <Link href="/operations/goods/add" className="btn btn-primary">
            <Plus size={16} /> Log Goods
          </Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading entries...
          </div>
        ) : (
          <DataTable
            data={filteredEntries}
            columns={columns}
            searchFields={['itemDescription', 'departmentReceiving']}
            actions={
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <select
                    className="form-select"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 2rem 0.25rem 0.5rem', minWidth: '120px' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as FilterType);
                      setSelectedIds([]); // Clear selection on filter change
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Recorded">Recorded</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                {selectedIds.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowApprovalModal(true)}
                  >
                    <CheckCircle size={16} /> Approve Selected ({selectedIds.length})
                  </button>
                )}
              </div>
            }
          />
        )}
      </div>

      {showApprovalModal && (
        <GoodsApprovalModal
          isOpen={showApprovalModal}
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={() => {
            setShowApprovalModal(false);
            setSelectedIds([]);
            fetchEntries();
          }}
        />
      )}
    </div>
  );
}
