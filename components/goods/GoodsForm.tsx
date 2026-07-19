'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS } from '@/lib/utils';
import type { GoodsEntry } from '@/lib/types';

interface GoodsFormProps {
  onSuccess: (newEntry: GoodsEntry) => void;
  onCancel: () => void;
}

export default function GoodsForm({ onSuccess, onCancel }: GoodsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    deliveryCompany: '',
    supplier: '',
    itemDescription: '',
    quantity: 1,
    departmentReceiving: DEPARTMENTS[0],
    receivedBy: '',
    deliveryNoteNumber: '',
    condition: 'good',
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
      const res = await fetch('/api/goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create entry');
      }

      const data = await res.json();
      
      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          category: 'goods',
          priority: 'low',
          entry: `Goods Received: ${formData.quantity}x ${formData.itemDescription} from ${formData.supplier} for ${formData.departmentReceiving}.`,
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
          <label className="form-label">Delivery Company/Driver</label>
          <input type="text" name="deliveryCompany" className="form-input" value={formData.deliveryCompany} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Supplier</label>
          <input type="text" name="supplier" className="form-input" value={formData.supplier} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Item Description</label>
          <input type="text" name="itemDescription" className="form-input" value={formData.itemDescription} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input type="number" name="quantity" className="form-input" min="1" value={formData.quantity} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Delivery Note / Invoice No.</label>
          <input type="text" name="deliveryNoteNumber" className="form-input" value={formData.deliveryNoteNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Department Receiving</label>
          <select name="departmentReceiving" className="form-select" value={formData.departmentReceiving} onChange={handleChange} required>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Received By (Staff Name)</label>
          <input type="text" name="receivedBy" className="form-input" value={formData.receivedBy} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Condition</label>
          <select name="condition" className="form-select" value={formData.condition} onChange={handleChange} required>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Remarks</label>
          <input type="text" name="remarks" className="form-input" placeholder="Any additional notes..." value={formData.remarks} onChange={handleChange} />
        </div>
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
