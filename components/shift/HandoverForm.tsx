'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime } from '@/lib/utils';
import type { ShiftHandover } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

interface HandoverFormProps {
  onSuccess: (newEntry: ShiftHandover) => void;
  onCancel: () => void;
}

export default function HandoverForm({ onSuccess, onCancel }: HandoverFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    incomingOfficer: '',
    shift: 'morning',
    outstandingIssues: 'None',
    equipmentStatus: 'All functional',
    patrolNotes: 'All patrols completed as scheduled. No anomalies found.',
    visitorsStillInside: 0,
    goodsPendingCollection: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/shift-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to record shift handover');
      }

      const data = await res.json();
      
      // Log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: getCurrentTime(),
          category: 'shift',
          priority: 'medium',
          entry: `Shift Handover: ${user?.name} handed over to ${formData.incomingOfficer} for the ${formData.shift} shift. ${formData.outstandingIssues !== 'None' ? 'Outstanding issues reported.' : 'No issues.'}`,
        }),
      });

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
          <label className="form-label">Shift</label>
          <select name="shift" className="form-select" value={formData.shift} onChange={handleChange} required>
            <option value="morning">Morning Shift (06:00 - 14:00)</option>
            <option value="afternoon">Afternoon Shift (14:00 - 22:00)</option>
            <option value="night">Night Shift (22:00 - 06:00)</option>
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Outgoing Officer</label>
          <input type="text" className="form-input" value={user?.name || ''} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Incoming Officer (Handing over to)</label>
          <input type="text" name="incomingOfficer" className="form-input" placeholder="Officer Name" value={formData.incomingOfficer} onChange={handleChange} required />
        </div>
      </div>

      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        Status & Remarks
      </h3>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Visitors Still Inside</label>
          <input type="number" name="visitorsStillInside" className="form-input" min="0" value={formData.visitorsStillInside} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Goods Pending Collection</label>
          <input type="number" name="goodsPendingCollection" className="form-input" min="0" value={formData.goodsPendingCollection} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Equipment Status</label>
        <textarea 
          name="equipmentStatus" 
          className="form-textarea" 
          value={formData.equipmentStatus} 
          onChange={handleChange} 
          required 
          rows={2}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Patrol Notes</label>
        <textarea 
          name="patrolNotes" 
          className="form-textarea" 
          value={formData.patrolNotes} 
          onChange={handleChange} 
          required 
          rows={2}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Outstanding Issues / Remarks</label>
        <textarea 
          name="outstandingIssues" 
          className="form-textarea" 
          value={formData.outstandingIssues} 
          onChange={handleChange} 
          required 
          rows={3}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Complete Handover'}
        </button>
      </div>
    </form>
  );
}
