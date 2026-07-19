'use client';

import { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import PlaybackForm from '@/components/playback/PlaybackForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV } from '@/lib/utils';
import type { PlaybackEntry } from '@/lib/types';

export default function PlaybackPage() {
  const [entries, setEntries] = useState<PlaybackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playback`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch playback entries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: PlaybackEntry) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        'Evd No.': e.evidenceNumber,
        'Req Date': e.dateRequested,
        'Inc Date': e.incidentDate,
        Camera: e.cameraNumber,
        Location: e.cameraLocation,
        RequestedBy: e.requestedBy,
        Department: e.department,
        Reason: e.reason,
        Format: e.exportFormat.toUpperCase(),
        UploadedBy: e.uploadedBy
      })),
      `Playback_Export_Log`
    );
  };

  const columns: Column<PlaybackEntry>[] = [
    { key: 'evidenceNumber', label: 'Evd No.', render: (item) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>{item.evidenceNumber}</span>, sortable: true },
    { key: 'dateRequested', label: 'Requested On', render: (item) => `${formatDate(item.dateRequested)} ${item.timeRequested}`, sortable: true },
    { key: 'cameraNumber', label: 'Camera / Location', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{item.cameraNumber}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {item.cameraLocation}
        </div>
      </div>
    ), sortable: true },
    { key: 'incidentDate', label: 'Incident Date', render: (item) => `${formatDate(item.incidentDate)} ${item.incidentTime}`, sortable: true },
    { key: 'requestedBy', label: 'Requested By', render: (item) => (
      <div>
        <div>{item.requestedBy}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.department}</div>
      </div>
    ), sortable: true },
    { key: 'reason', label: 'Reason', render: (item) => (
      <div style={{ fontSize: '0.8125rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.reason}
      </div>
    )},
    { key: 'exportFormat', label: 'Format', render: (item) => <StatusBadge status="closed" size="sm" /> /* Using grey badge for format */, sortable: true },
    { key: 'uploadedBy', label: 'Officer', sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Playback Upload Register</h1>
          <p className="page-subtitle">Log and track CCTV footage exports and reviews.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Playback
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
            searchFields={['evidenceNumber', 'cameraNumber', 'cameraLocation', 'requestedBy', 'reason']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Log CCTV Playback"
        size="lg"
      >
        <PlaybackForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
