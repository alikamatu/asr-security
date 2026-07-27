'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, CheckCircle, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import GoodsApprovalModal from '@/components/goods/GoodsApprovalModal';
import ItemPreviewSheet from '@/components/goods/ItemPreviewSheet';

import { formatDate, exportToCSV } from '@/lib/utils';
import type { GoodsEntry } from '@/lib/types';

type FilterType = 'All' | 'Recorded' | 'Approved' | 'Remainder';

export default function GoodsPage() {
  const [entries, setEntries] = useState<GoodsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterType>('All');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [approvalRemainders, setApprovalRemainders] = useState<{ [id: string]: number }>({});

  const handleDirectApprove = () => {
    const newRemainders: { [id: string]: number } = {};
    selectedIds.forEach(id => {
      const item = entries.find(e => e._id === id);
      if (item && (item.hasRemainder || item.status === 'Remainder') && item.remainder !== undefined) {
        newRemainders[id] = item.remainder;
      }
    });
    setApprovalRemainders(newRemainders);
    setShowApprovalModal(true);
  };

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
      const recordIds = filteredEntries
        .filter(item => {
          const isRecorded = (item.status || 'Recorded') === 'Recorded';
          const hasUnresolvedRemainder = item.status === 'Remainder' || item.hasRemainder;
          return (isRecorded || hasUnresolvedRemainder) && item._id;
        })
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
  const selectableItems = filteredEntries.filter(item => {
    const isRecorded = (item.status || 'Recorded') === 'Recorded';
    const hasUnresolvedRemainder = item.status === 'Remainder' || item.hasRemainder;
    return (isRecorded || hasUnresolvedRemainder) && item._id;
  });
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
        const hasUnresolvedRemainder = item.status === 'Remainder' || item.hasRemainder;
        const isSelectable = isRecorded || hasUnresolvedRemainder;

        return isSelectable ? (
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
            {['Approved', 'Remainder'].includes(item.status || '') && item.approvedBy && (
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                {item.status === 'Remainder' ? 'Marked Remainder by: ' : 'Verified by: '}{item.approvedBy}
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
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {item.quantity} {item.quantityUnit || 'pcs'}
            {(item.status === 'Remainder' || item.hasRemainder) && item.remainder !== undefined && (
              <span style={{ color: 'var(--color-danger)', marginLeft: '0.5rem', fontWeight: 600 }}>
                {item.remainder}
              </span>
            )}
          </div>
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
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
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
                        onClick={handleDirectApprove}
                      >
                        <CheckCircle size={16} /> Approve Selected ({selectedIds.length})
                      </button>
                    )}
                  </div>
                }
              />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={allSelectableChecked}
                      onChange={handleSelectAll}
                      disabled={selectableItems.length === 0}
                      title="Select all 'Recorded' items"
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Select All</span>
                  </div>

                  <select
                    className="form-select"
                    style={{ fontSize: '0.8125rem', padding: '0.25rem 2rem 0.25rem 0.5rem' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as FilterType);
                      setSelectedIds([]);
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Recorded">Recorded</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div className="timeline">
                {filteredEntries.map((item, index) => {
                  const isRecorded = (item.status || 'Recorded') === 'Recorded';
                  const hasUnresolvedRemainder = item.status === 'Remainder' || item.hasRemainder;
                  const isSelectable = isRecorded || hasUnresolvedRemainder;
                  const isChecked = !!item._id && selectedIds.includes(item._id);

                  return (
                    <div
                      key={item._id || index}
                      className="timeline-item"
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => item._id && handleSelectOne(item._id, e)}
                            style={{ marginRight: '0.25rem' }}
                          />
                        )}
                        <span className="timeline-time">{formatDate(item.date)} {item.time}</span>
                        <StatusBadge status={item.status || 'Recorded'} size="sm" />
                      </div>
                      <div className="timeline-content" style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p
                              style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-primary)',
                                fontWeight: 500,
                                margin: 0,
                              }}
                            >
                              {item.itemDescription}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                              Qty: {item.quantity} {item.quantityUnit || 'pcs'}
                              {(item.status === 'Remainder' || item.hasRemainder) && item.remainder !== undefined && (
                                <span style={{ color: 'var(--color-danger)', marginLeft: '0.5rem', fontWeight: 600 }}>
                                  {item.remainder}
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ margin: 0 }}>To: {item.departmentReceiving}</p>
                            <p style={{ margin: 0 }}>By: {item.receivedBy}</p>
                          </div>
                        </div>
                        {['Approved', 'Remainder'].includes(item.status || '') && item.approvedBy && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                            ✓ {item.status === 'Remainder' ? 'Marked Remainder by: ' : 'Verified by: '} {item.approvedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No items found.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Preview Button */}
      {selectedIds.length > 0 && (
        <button
          onClick={() => setShowPreviewSheet(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 50,
            cursor: 'pointer',
            border: 'none',
          }}
          title="Preview Selected Items"
        >
          <Eye size={24} />
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selectedIds.length}
          </span>
        </button>
      )}

      {showPreviewSheet && (
        <ItemPreviewSheet
          isOpen={showPreviewSheet}
          selectedItems={entries.filter(e => selectedIds.includes(e._id as string))}
          onClose={() => setShowPreviewSheet(false)}
          onContinueToApprove={(remainders) => {
            setApprovalRemainders(remainders);
            setShowPreviewSheet(false);
            setShowApprovalModal(true);
          }}
        />
      )}

      {showApprovalModal && (
        <GoodsApprovalModal
          isOpen={showApprovalModal}
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          remainders={approvalRemainders}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={() => {
            setShowApprovalModal(false);
            setSelectedIds([]);
            setApprovalRemainders({});
            fetchEntries();
          }}
        />
      )}
    </div>
  );
}
