'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS, LOCATIONS, generateEvidenceNumber } from '@/lib/utils';
import type { PlaybackEntry } from '@/lib/types';

interface PlaybackFormProps {
  onSuccess: (newEntry: PlaybackEntry) => void;
  onCancel: () => void;
}

export default function PlaybackForm({ onSuccess, onCancel }: PlaybackFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    dateRequested: getTodayDate(),
    timeRequested: getCurrentTime(),
    cameraNumber: '',
    cameraLocation: LOCATIONS[0],
    incidentDate: getTodayDate(),
    incidentTime: getCurrentTime(),
    requestedBy: '',
    department: DEPARTMENTS[0],
    reason: '',
    footageDuration: '',
    exportFormat: 'mp4',
    storageLocation: 'NVR Archive',
    evidenceNumber: generateEvidenceNumber(),
    remarks: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            uploadDate: getTodayDate(), // Assuming uploaded immediately for now
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record playback request');
      }

      const data = await res.json();
      
      // Log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.dateRequested,
          time: formData.timeRequested,
          category: 'playback',
          priority: 'medium',
          entry: `CCTV Playback Exported: Camera ${formData.cameraNumber} (${formData.cameraLocation}) for incident on ${formData.incidentDate}. Evidence No: ${formData.evidenceNumber}. Requested by ${formData.requestedBy}.`,
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
          <label className="form-label">Evidence Number (Auto-generated)</label>
          <input type="text" name="evidenceNumber" className="form-input" value={formData.evidenceNumber} disabled />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Date Requested</label>
          <input type="date" name="dateRequested" className="form-input" value={formData.dateRequested} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time Requested</label>
          <input type="time" name="timeRequested" className="form-input" value={formData.timeRequested} onChange={handleChange} required />
        </div>
      </div>

      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '0.75rem', marginTop: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        Camera & Incident Details
      </h3>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Camera Number/Name</label>
          <input type="text" name="cameraNumber" className="form-input" placeholder="e.g. CAM-04" value={formData.cameraNumber} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Camera Location</label>
          <select name="cameraLocation" className="form-select" value={formData.cameraLocation} onChange={handleChange} required>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Date of Incident</label>
          <input type="date" name="incidentDate" className="form-input" value={formData.incidentDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time of Incident</label>
          <input type="time" name="incidentTime" className="form-input" value={formData.incidentTime} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Reason for Playback</label>
        <textarea 
          name="reason" 
          className="form-textarea" 
          placeholder="Briefly describe why the footage is needed..." 
          value={formData.reason} 
          onChange={handleChange} 
          required 
          rows={2}
        />
      </div>

      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        Requestor & Export Details
      </h3>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Requested By</label>
          <input type="text" name="requestedBy" className="form-input" placeholder="Name of person requesting" value={formData.requestedBy} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select name="department" className="form-select" value={formData.department} onChange={handleChange} required>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Footage Duration (approx)</label>
          <input type="text" name="footageDuration" className="form-input" placeholder="e.g. 15 mins" value={formData.footageDuration} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Export Format</label>
          <select name="exportFormat" className="form-select" value={formData.exportFormat} onChange={handleChange} required>
            <option value="mp4">MP4</option>
            <option value="avi">AVI</option>
            <option value="mkv">MKV</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Remarks</label>
        <input type="text" name="remarks" className="form-input" value={formData.remarks} onChange={handleChange} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Log Playback & Export'}
        </button>
      </div>
    </form>
  );
}
