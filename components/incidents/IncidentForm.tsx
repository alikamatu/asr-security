'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, LOCATIONS } from '@/lib/utils';
import type { Incident } from '@/lib/types';

interface IncidentFormProps {
  onSuccess: (newEntry: Incident) => void;
  onCancel: () => void;
}

export default function IncidentForm({ onSuccess, onCancel }: IncidentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    incidentType: 'other',
    location: LOCATIONS[0],
    description: '',
    actionTaken: '',
    personsInvolved: '',
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
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create incident report');
      }

      const data = await res.json();
      
      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          category: 'incident',
          priority: formData.incidentType === 'fire' || formData.incidentType === 'medical' || formData.incidentType === 'assault' ? 'critical' : 'high',
          entry: `Incident Reported (${formData.incidentType}): ${formData.description.substring(0, 100)}... at ${formData.location}`,
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
          <label className="form-label">Time</label>
          <input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Incident Type</label>
          <select name="incidentType" className="form-select" value={formData.incidentType} onChange={handleChange} required>
            <option value="theft">Theft</option>
            <option value="assault">Assault / Altercation</option>
            <option value="fire">Fire / Smoke</option>
            <option value="medical">Medical Emergency</option>
            <option value="vandalism">Vandalism / Damage</option>
            <option value="trespassing">Trespassing</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <select name="location" className="form-select" value={formData.location} onChange={handleChange} required>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Description of Incident</label>
        <textarea 
          name="description" 
          className="form-textarea" 
          placeholder="Detailed account of what happened..." 
          value={formData.description} 
          onChange={handleChange} 
          required 
          rows={3}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Action Taken</label>
        <textarea 
          name="actionTaken" 
          className="form-textarea" 
          placeholder="Steps taken by security to address the incident..." 
          value={formData.actionTaken} 
          onChange={handleChange} 
          required 
          rows={2}
        />
      </div>

      <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Persons Involved (Optional)</label>
          <input type="text" name="personsInvolved" className="form-input" placeholder="Names or descriptions" value={formData.personsInvolved} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Initial Status</label>
          <select name="status" className="form-select" value={formData.status} onChange={handleChange} required>
            <option value="open">Open (Requires Action)</option>
            <option value="investigating">Under Investigation</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Report'}
        </button>
      </div>
    </form>
  );
}
