'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime } from '@/lib/utils';
import type { EquipmentEntry } from '@/lib/types';

interface EquipmentFormProps {
  onSuccess: (newEntry: EquipmentEntry) => void;
  onCancel: () => void;
}

export default function EquipmentForm({ onSuccess, onCancel }: EquipmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    dateIssued: getTodayDate(),
    timeIssued: getCurrentTime(),
    itemName: '',
    serialNumber: '',
    issuedTo: '',
    department: 'Security',
    purpose: '',
    conditionOnIssue: 'good',
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
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to issue equipment');
      }

      const data = await res.json();
      
      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.dateIssued,
          time: formData.timeIssued,
          category: 'equipment',
          priority: 'low',
          entry: `Equipment Issued: ${formData.itemName} (SN: ${formData.serialNumber}) issued to ${formData.issuedTo}. Condition: ${formData.conditionOnIssue}.`,
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
          <label className="form-label">Date Issued</label>
          <input type="date" name="dateIssued" className="form-input" value={formData.dateIssued} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time Issued</label>
          <input type="time" name="timeIssued" className="form-input" value={formData.timeIssued} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Item Name</label>
          <input type="text" name="itemName" className="form-input" placeholder="e.g. Motorola Radio, Flashlight" value={formData.itemName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Serial / Tag Number</label>
          <input type="text" name="serialNumber" className="form-input" value={formData.serialNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Issued To (Name)</label>
          <input type="text" name="issuedTo" className="form-input" value={formData.issuedTo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Department / Agency</label>
          <input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Condition on Issue</label>
          <select name="conditionOnIssue" className="form-select" value={formData.conditionOnIssue} onChange={handleChange} required>
            <option value="good">Good / Fully Functional</option>
            <option value="fair">Fair / Functional with minor wear</option>
            <option value="damaged">Damaged / Needs Repair</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Purpose / Location</label>
          <input type="text" name="purpose" className="form-input" placeholder="e.g. Night Patrol Area C" value={formData.purpose} onChange={handleChange} required />
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Issue Equipment'}
        </button>
      </div>
    </form>
  );
}
