'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS } from '@/lib/utils';
import type { VehicleEntry } from '@/lib/types';

interface VehicleFormProps {
  onSuccess: (newEntry: VehicleEntry) => void;
  onCancel: () => void;
}

export default function VehicleForm({ onSuccess, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    timeIn: getCurrentTime(),
    registrationNumber: '',
    vehicleType: 'Car',
    driverName: '',
    company: '',
    purpose: '',
    destination: DEPARTMENTS[0],
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
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to register vehicle');
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
          <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time In</label>
          <input type="time" name="timeIn" className="form-input" value={formData.timeIn} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Registration Number</label>
          <input type="text" name="registrationNumber" className="form-input" placeholder="e.g. GW-1234-22" value={formData.registrationNumber} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Vehicle Type</label>
          <select name="vehicleType" className="form-select" value={formData.vehicleType} onChange={handleChange} required>
            <option value="Car">Car</option>
            <option value="SUV/Pickup">SUV/Pickup</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Driver Name</label>
          <input type="text" name="driverName" className="form-input" value={formData.driverName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Company/Organization (Optional)</label>
          <input type="text" name="company" className="form-input" value={formData.company} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Purpose of Visit</label>
          <input type="text" name="purpose" className="form-input" value={formData.purpose} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Destination</label>
          <select name="destination" className="form-select" value={formData.destination} onChange={handleChange} required>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Register Vehicle'}
        </button>
      </div>
    </form>
  );
}
