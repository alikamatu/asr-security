'use client';

import { useEffect, useState } from 'react';
import { Plus, PlayCircle, Download, Clock, Video } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { PlaybackEntry, PlaybackTimeline } from '@/lib/types';

export default function PlaybackPage() {
  const [entries, setEntries] = useState<PlaybackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState<PlaybackEntry | null>(null);

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

  const openViewModal = (entry: PlaybackEntry) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };

  const columns: Column<PlaybackEntry>[] = [
    { key: 'evidenceNumber', label: 'Evd No.', render: (item) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>{item.evidenceNumber}</span>, sortable: true },
    { key: 'title', label: 'Incident Title', render: (item) => (
      <div>
        <div style={{ fontWeight: 600 }}>{item.title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </div>
      </div>
    ), sortable: true },
    { key: 'timelines', label: 'Footage', render: (item) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--color-surface-hover)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 500 }}>
        <Video size={14} /> {item.timelines?.length || 0} clips
      </span>
    ), sortable: false },
    { key: 'createdAt', label: 'Logged On', render: (item) => formatDate(item.createdAt || ''), sortable: true },
    { key: 'uploaderName', label: 'Officer', render: (item) => item.uploaderName || item.uploadedBy, sortable: true },
    { key: 'actions', label: '', render: (item) => (
      <button className="btn btn-secondary btn-sm" onClick={() => openViewModal(item)}>
        <PlayCircle size={14} /> View Details
      </button>
    ), sortable: false }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} />
            Playback Manager
          </h1>
          <p className="page-subtitle">Log CCTV playback incidents with multiple timelines and video footage.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/operations/playback/add" className="btn btn-primary">
            <Plus size={16} /> Log Incident
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
            data={entries}
            columns={columns}
            searchFields={['evidenceNumber', 'title', 'description', 'uploaderName']}
          />
        )}
      </div>

      {/* View Details Modal */}
      {selectedEntry && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)}
          title={`Incident: ${selectedEntry.title}`}
          size="lg"
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Evidence No. {selectedEntry.evidenceNumber}
                </span>
                <p style={{ marginTop: '0.5rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {selectedEntry.description}
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                <div>Logged by {selectedEntry.uploaderName}</div>
                <div>{formatDate(selectedEntry.createdAt || '')}</div>
              </div>
            </div>
            
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '2rem' }}>
              Incident Timelines ({selectedEntry.timelines?.length || 0})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {selectedEntry.timelines?.map((timeline: PlaybackTimeline, index: number) => (
                <div key={timeline._id || index} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                      <Clock size={16} /> 
                      {formatDate(timeline.date)} at {timeline.time}
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {timeline.description}
                  </p>

                  {timeline.videoData ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <video 
                        controls 
                        src={timeline.videoData} 
                        style={{ width: '100%', maxHeight: '300px', borderRadius: '4px', background: '#000' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          File: {timeline.originalFileName} ({(timeline.size! / (1024*1024)).toFixed(2)} MB)
                        </span>
                        <a href={timeline.videoData} download={timeline.originalFileName} className="btn btn-ghost btn-sm" title="Download Video">
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
                      No video attached for this timeline.
                    </div>
                  )}
                </div>
              ))}
              
              {(!selectedEntry.timelines || selectedEntry.timelines.length === 0) && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No timelines recorded.
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
