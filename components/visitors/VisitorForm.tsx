'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS, generatePassNumber } from '@/lib/utils';
import type { Visitor } from '@/lib/types';

interface VisitorFormProps {
  onSuccess: (newEntry: Visitor) => void;
  onCancel: () => void;
}

export default function VisitorForm({ onSuccess, onCancel }: VisitorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    timeIn: getCurrentTime(),
    visitorName: '',
    phoneNumber: '',
    company: '',
    personVisiting: '',
    department: DEPARTMENTS[0],
    purpose: '',
    idType: 'national-id',
    idNumber: '',
    vehicleNumber: '',
    visitorPassNumber: generatePassNumber(),
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
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to register visitor');
      }

      const data = await res.json();
      
      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.timeIn,
          category: 'visitor',
          priority: 'low',
          entry: `Visitor Registered: ${formData.visitorName} from ${formData.company || 'Private'} visiting ${formData.personVisiting} (${formData.department}). Pass: ${formData.visitorPassNumber}.`,
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
          <label className="form-label">Visitor Pass Number (Auto-generated)</label>
          <input type="text" name="visitorPassNumber" className="form-input" value={formData.visitorPassNumber} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Time In</label>
          <input type="time" name="timeIn" className="form-input" value={formData.timeIn} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Visitor Full Name</label>
          <input type="text" name="visitorName" className="form-input" placeholder="Visitor&apos;s Full Name" value={formData.visitorName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input type="tel" name="phoneNumber" className="form-input" value={formData.phoneNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Company/Organization (Optional)</label>
          <input type="text" name="company" className="form-input" value={formData.company} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Vehicle Registration (Optional)</label>
          <input type="text" name="vehicleNumber" className="form-input" value={formData.vehicleNumber} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Person Visiting</label>
          <input type="text" name="personVisiting" className="form-input" value={formData.personVisiting} onChange={handleChange} required />
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
          <label className="form-label">ID Type</label>
          <select name="idType" className="form-select" value={formData.idType} onChange={handleChange} required>
            <option value="national-id">National ID</option>
            <option value="passport">Passport</option>
            <option value="drivers-license">Driver&apos;s License</option>
            <option value="voter-id">Voter ID</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ID Number</label>
          <input type="text" name="idNumber" className="form-input" value={formData.idNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Purpose of Visit</label>
        <input type="text" name="purpose" className="form-input" value={formData.purpose} onChange={handleChange} required />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Register Visitor'}
        </button>
      </div>
    </form>
  );
}
