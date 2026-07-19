'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime } from '@/lib/utils';
import type { OBEntry } from '@/lib/types';

interface OBEntryFormProps {
  onSuccess: (newEntry: OBEntry) => void;
  onCancel: () => void;
}

export default function OBEntryForm({ onSuccess, onCancel }: OBEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    category: 'general',
    priority: 'low',
    entry: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create entry');
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
        <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            name="date"
            className="form-input"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Time</label>
          <input
            type="time"
            name="time"
            className="form-input"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select name="category" className="form-select" value={formData.category} onChange={handleChange} required>
            <option value="general">General</option>
            <option value="delivery">Delivery</option>
            <option value="visitor">Visitor</option>
            <option value="playback">Playback Request</option>
            <option value="goods">Goods Received</option>
            <option value="patrol">Patrol Completed</option>
            <option value="tip">Tip Received</option>
            <option value="shift">Shift Handover</option>
            <option value="incident">Incident</option>
            <option value="equipment">Equipment Issue</option>
            <option value="vehicle">Vehicle</option>
            <option value="lost-found">Lost & Found</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select name="priority" className="form-select" value={formData.priority} onChange={handleChange} required>
            <option value="low">Low (Routine)</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Entry Details</label>
        <textarea
          name="entry"
          className="form-textarea"
          placeholder="Detailed description of the occurrence..."
          value={formData.entry}
          onChange={handleChange}
          required
          rows={4}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}
