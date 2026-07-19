'use client';

import { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import IncidentForm from '@/components/incidents/IncidentForm';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, exportToCSV, capitalize } from '@/lib/utils';
import type { Incident } from '@/lib/types';

export default function IncidentsPage() {
  const [entries, setEntries] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSuccess = (newEntry: Incident) => {
    setIsModalOpen(false);
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Time: e.time,
        Type: capitalize(e.incidentType),
        Location: e.location,
        Description: e.description,
        'Action Taken': e.actionTaken,
        'Persons Involved': e.personsInvolved || 'N/A',
        Status: capitalize(e.status),
        Officer: e.officerReporting
      })),
      `Incident_Log`
    );
  };

  const columns: Column<Incident>[] = [
    { key: 'date', label: 'Date', render: (item) => `${formatDate(item.date)} ${item.time}`, sortable: true },
    { key: 'incidentType', label: 'Incident Details', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{capitalize(item.incidentType)}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </div>
      </div>
    ), sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'actionTaken', label: 'Action Taken', render: (item) => (
      <div style={{ fontSize: '0.8125rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.actionTaken}
      </div>
    )},
    { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} size="sm" />, sortable: true },
    { key: 'officerReporting', label: 'Reporting Officer', sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Log</h1>
          <p className="page-subtitle">Track and manage security incidents, breaches, and emergencies.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Report Incident
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
            searchFields={['incidentType', 'location', 'description', 'actionTaken', 'personsInvolved', 'officerReporting']}
          />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Report New Incident"
        size="lg"
      >
        <IncidentForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
