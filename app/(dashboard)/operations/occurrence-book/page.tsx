'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, Calendar, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import OBEntryForm from '@/components/ob/OBEntryForm';
import StatusBadge from '@/components/ui/StatusBadge';
import { getTodayDate, capitalize, exportToCSV, searchFilter } from '@/lib/utils';
import type { OBEntry } from '@/lib/types';

export default function OccurrenceBookPage() {
  const [entries, setEntries] = useState<OBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEntries = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ob?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch OB entries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(filterDate);
  }, [filterDate]);

  const handleSuccess = (newEntry: OBEntry) => {
    setIsModalOpen(false);
    // Refresh if the new entry matches the currently viewed date
    if (newEntry.date === filterDate) {
      setEntries((prev) => [newEntry, ...prev].sort((a, b) => b.time.localeCompare(a.time)));
    }
  };

  const handleExport = () => {
    exportToCSV(
      entries.map(e => ({
        Date: e.date,
        Time: e.time,
        Category: capitalize(e.category),
        Priority: capitalize(e.priority),
        Entry: e.entry,
        Officer: e.officer
      })),
      `Occurrence_Book_${filterDate}`
    );
  };

  const filteredEntries = searchFilter(entries, searchQuery, ['entry', 'officer', 'category']);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Occurrence Book (OB)</h1>
          <p className="page-subtitle">Master log of all control room events and activities.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={entries.length === 0}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input 
              type="date" 
              className="form-input" 
              style={{ width: 'auto' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              max={getTodayDate()}
            />
          </div>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <Search />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No entries found</h3>
            <p>No activities have been recorded for {filterDate === getTodayDate() ? 'today' : 'this date'}.</p>
          </div>
        ) : (
          <div className="timeline" style={{ padding: '1rem' }}>
            {filteredEntries.map((entry) => (
              <div 
                key={entry._id} 
                className={`timeline-item ${
                  entry.priority === 'critical' ? 'priority-critical' :
                  entry.priority === 'high' ? 'priority-high' : ''
                }`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="timeline-time">{entry.time}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                    {capitalize(entry.category)}
                  </span>
                  {entry.priority !== 'low' && (
                    <StatusBadge status={entry.priority} size="sm" />
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                    Officer: <strong>{entry.officer}</strong>
                  </span>
                </div>
                <div className="timeline-content">
                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginTop: '0.375rem' }}>
                    {entry.entry}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add OB Entry"
      >
        <OBEntryForm 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}

// Ensure the icon is imported
import { BookOpen } from 'lucide-react';
