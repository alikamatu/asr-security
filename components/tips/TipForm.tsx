'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, LOCATIONS } from '@/lib/utils';
import type { Tip } from '@/lib/types';

interface TipFormProps {
  onSuccess: (newEntry: Tip) => void;
  onCancel: () => void;
}

export default function TipForm({ onSuccess, onCancel }: TipFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    source: 'anonymous',
    tipCategory: 'other',
    location: LOCATIONS[0],
    description: '',
    priority: 'medium',
    assignedTo: '',
    status: 'open',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to record tip');
      }

      const data = await res.json();
      
      // Also log to OB if priority is high or critical
      if (formData.priority === 'high' || formData.priority === 'critical') {
        await fetch('/api/ob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formData.date,
            time: formData.time,
            category: 'tip',
            priority: formData.priority,
            entry: `High Priority Tip Received (${formData.tipCategory}): ${formData.description.substring(0, 100)}... at ${formData.location}`,
          }),
        });
      }

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
          <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time</label>
          <input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Information Source</label>
          <select name="source" className="form-select" value={formData.source} onChange={handleChange} required>
            <option value="anonymous">Anonymous</option>
            <option value="staff">Staff Member</option>
            <option value="visitor">Visitor / Guest</option>
            <option value="police">Police / Security Agent</option>
            <option value="public">General Public</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select name="tipCategory" className="form-select" value={formData.tipCategory} onChange={handleChange} required>
            <option value="theft">Theft / Pilfering</option>
            <option value="suspicious-person">Suspicious Person</option>
            <option value="fraud">Fraud / Scam</option>
            <option value="safety">Safety Hazard</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Location</label>
          <select name="location" className="form-select" value={formData.location} onChange={handleChange} required>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select name="priority" className="form-select" value={formData.priority} onChange={handleChange} required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Tip Description</label>
        <textarea 
          name="description" 
          className="form-textarea" 
          placeholder="Detailed description of the information received..." 
          value={formData.description} 
          onChange={handleChange} 
          required 
          rows={4}
        />
      </div>

      <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Assigned To (Investigator)</label>
          <input type="text" name="assignedTo" className="form-input" placeholder="Officer name (Optional)" value={formData.assignedTo} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Initial Status</label>
          <select name="status" className="form-select" value={formData.status} onChange={handleChange} required>
            <option value="open">Open (Awaiting Investigation)</option>
            <option value="investigating">Under Investigation</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Record Tip'}
        </button>
      </div>
    </form>
  );
}
