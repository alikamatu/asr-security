'use client';

import { useState, useRef } from 'react';
import { Loader2, Plus, Trash2, Video } from 'lucide-react';
import { getTodayDate, getCurrentTime } from '@/lib/utils';
import type { PlaybackEntry } from '@/lib/types';

interface PlaybackFormProps {
  onSuccess: (newEntry: PlaybackEntry) => void;
  onCancel: () => void;
}

interface TimelineForm {
  id: string;
  date: string;
  time: string;
  description: string;
  file: File | null;
}

export default function PlaybackForm({ onSuccess, onCancel }: PlaybackFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [timelines, setTimelines] = useState<TimelineForm[]>([
    {
      id: Math.random().toString(),
      date: getTodayDate(),
      time: getCurrentTime(),
      description: '',
      file: null,
    }
  ]);

  const addTimeline = () => {
    setTimelines(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        date: getTodayDate(),
        time: getCurrentTime(),
        description: '',
        file: null,
      }
    ]);
  };

  const removeTimeline = (id: string) => {
    setTimelines(prev => prev.filter(t => t.id !== id));
  };

  const handleTimelineChange = (id: string, field: keyof TimelineForm, value: any) => {
    setTimelines(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and main description are required.');
      }

      if (timelines.length === 0) {
        throw new Error('Please add at least one timeline.');
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      const timelinesMeta = timelines.map(t => ({
        date: t.date,
        time: t.time,
        description: t.description,
      }));
      formData.append('timelinesStr', JSON.stringify(timelinesMeta));

      // Check sizes and append files
      let totalSize = 0;
      timelines.forEach((t, index) => {
        if (t.file) {
          totalSize += t.file.size;
          formData.append(`timelineFile_${index}`, t.file);
        }
      });

      if (totalSize > 10 * 1024 * 1024) {
        throw new Error('Total size of all videos exceeds the 10MB limit. Please compress them or upload fewer clips at once.');
      }

      const res = await fetch('/api/playback', {
        method: 'POST',
        body: formData, // fetch will auto-set multipart/form-data boundary
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record playback entry');
      }

      const data = await res.json();
      onSuccess(data.entry);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stagger-children">
      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Main Title</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="e.g. Theft Incident at Main Gate" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Main Description</label>
        <textarea 
          className="form-textarea" 
          placeholder="Describe the overall incident..." 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          required 
          rows={3}
        />
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Footage Timelines</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addTimeline}>
          <Plus size={14} /> Add Timeline
        </button>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {timelines.map((timeline, index) => (
          <div key={timeline.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '1rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--color-danger)' }}
                onClick={() => removeTimeline(timeline.id)}
                disabled={timelines.length === 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-primary)' }}>
              Timeline #{index + 1}
            </h4>
            
            <div className="grid-form" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Date of Incident</label>
                <input type="date" className="form-input" value={timeline.date} onChange={e => handleTimelineChange(timeline.id, 'date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Timestamp</label>
                <input type="time" className="form-input" value={timeline.time} onChange={e => handleTimelineChange(timeline.id, 'time', e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Timeline Description</label>
              <input type="text" className="form-input" placeholder="e.g. Suspect enters the building" value={timeline.description} onChange={e => handleTimelineChange(timeline.id, 'description', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Footage (Max 10MB total across all timelines)</label>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '4px', border: '1px dashed var(--color-border)' }}
              >
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleTimelineChange(timeline.id, 'file', e.target.files[0]);
                    }
                  }} 
                  style={{ display: 'none' }}
                  id={`file-${timeline.id}`}
                />
                <label htmlFor={`file-${timeline.id}`} className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Video size={14} /> {timeline.file ? 'Change Video' : 'Attach Video'}
                </label>
                <span style={{ fontSize: '0.8125rem', color: timeline.file ? 'var(--color-text)' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {timeline.file ? timeline.file.name : 'No video selected (optional)'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Log Playback & Upload'}
        </button>
      </div>
    </form>
  );
}
