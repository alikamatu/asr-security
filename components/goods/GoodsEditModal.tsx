'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import { Loader2 } from 'lucide-react';
import type { GoodsEntry } from '@/lib/types';
import { DEPARTMENTS } from '@/lib/utils';

interface GoodsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: GoodsEntry;
}

export default function GoodsEditModal({
  isOpen,
  onClose,
  onSuccess,
  item
}: GoodsEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit form state
  const [itemDescription, setItemDescription] = useState(item.itemDescription || '');
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '');
  const [quantityUnit, setQuantityUnit] = useState(item.quantityUnit || '');
  const [departmentReceiving, setDepartmentReceiving] = useState(item.departmentReceiving || '');
  const [receivedBy, setReceivedBy] = useState(item.receivedBy || '');

  // Authorization state
  const [editorName, setEditorName] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName) {
      setError('Editor name is required');
      return;
    }
    if (!pin || pin.length !== 5) {
      setError('PIN must be 5 digits');
      return;
    }
    
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/goods/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            itemDescription,
            quantity: parsedQty,
            quantityUnit,
            departmentReceiving,
            receivedBy
          },
          editorName,
          pin
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update. Please check your PIN.');
        setPin(''); // clear PIN to retry
      }
    } catch (err) {
      console.error(err);
      setError('Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Goods Entry" size="md">
      <form onSubmit={handleSubmit} className="stagger-children" style={{ padding: '1rem 0' }}>
        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Item Description</label>
          <input 
            type="text" 
            className="form-input" 
            value={itemDescription} 
            onChange={(e) => setItemDescription(e.target.value)} 
            required 
          />
        </div>

        <div className="grid-form" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input 
              type="number" 
              step="any" 
              className="form-input" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <input 
              type="text" 
              className="form-input" 
              value={quantityUnit} 
              onChange={(e) => setQuantityUnit(e.target.value)} 
            />
          </div>
        </div>

        <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <select className="form-select" value={departmentReceiving} onChange={(e) => setDepartmentReceiving(e.target.value)} required>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Received By</label>
            <AutocompleteInput 
              type="user"
              value={receivedBy} 
              onChange={(val) => setReceivedBy(val)} 
              required 
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
          Enter your name and PIN to authorize this edit.
        </p>

        <div className="grid-form" style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <AutocompleteInput 
              type="user"
              value={editorName}
              onChange={setEditorName}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">5-Digit PIN</label>
            <input
              type="password"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em' }}
              maxLength={5}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="•••••"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || pin.length !== 5 || !editorName}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
