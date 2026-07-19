'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, LOCATIONS } from '@/lib/utils';
import type { LostFoundEntry } from '@/lib/types';

interface LostFoundFormProps {
  onSuccess: (newEntry: LostFoundEntry) => void;
  onCancel: () => void;
}

export default function LostFoundForm({ onSuccess, onCancel }: LostFoundFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    dateFound: getTodayDate(),
    timeFound: getCurrentTime(),
    itemDescription: '',
    category: 'electronics',
    locationFound: LOCATIONS[0],
    foundBy: '',
    finderContact: '',
    storageLocation: 'Control Room Safe',
    status: 'unclaimed',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to record found item');
      }

      const data = await res.json();
      
      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.dateFound,
          time: formData.timeFound,
          category: 'lost-found',
          priority: 'low',
          entry: `Found Item Logged: ${formData.itemDescription} found at ${formData.locationFound} by ${formData.foundBy || 'Unknown'}. Secured in ${formData.storageLocation}.`,
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
          <label className="form-label">Date Found</label>
          <input type="date" name="dateFound" className="form-input" value={formData.dateFound} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time Found</label>
          <input type="time" name="timeFound" className="form-input" value={formData.timeFound} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Item Description</label>
        <input 
          type="text" 
          name="itemDescription" 
          className="form-input" 
          placeholder="Detailed description (color, brand, distinguishing marks)..." 
          value={formData.itemDescription} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select name="category" className="form-select" value={formData.category} onChange={handleChange} required>
            <option value="electronics">Electronics (Phones, Laptops, etc.)</option>
            <option value="wallet-purse">Wallet / Purse</option>
            <option value="keys">Keys</option>
            <option value="clothing">Clothing / Accessories</option>
            <option value="documents">Documents / IDs</option>
            <option value="jewelry">Jewelry / Watches</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Location Found</label>
          <select name="locationFound" className="form-select" value={formData.locationFound} onChange={handleChange} required>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Found By (Name)</label>
          <input type="text" name="foundBy" className="form-input" placeholder="Staff or Guest Name" value={formData.foundBy} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Finder&apos;s Contact (Optional)</label>
          <input type="text" name="finderContact" className="form-input" value={formData.finderContact} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Storage Location</label>
          <input type="text" name="storageLocation" className="form-input" value={formData.storageLocation} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Log Found Item'}
        </button>
      </div>
    </form>
  );
}
