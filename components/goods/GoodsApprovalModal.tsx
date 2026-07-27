'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import { Loader2 } from 'lucide-react';

interface GoodsApprovalModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onSuccess: (modifiedCount: number) => void;
  selectedIds: string[];
  remainders?: { [id: string]: number };
}

export default function GoodsApprovalModal({
  isOpen,
  selectedCount,
  onClose,
  onSuccess,
  selectedIds,
  remainders = {}
}: GoodsApprovalModalProps) {
  const [approverName, setApproverName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName) {
      setError('Approver name is required');
      return;
    }
    if (!pin || pin.length !== 5) {
      setError('PIN must be 5 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/goods/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, approverName, pin, remainders }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.modifiedCount);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid PIN. Please try again.');
        setPin(''); // clear PIN to retry
      }
    } catch (err) {
      console.error(err);
      setError('Approval failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Goods" size="md">
      <form onSubmit={handleSubmit} className="stagger-children" style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          You are about to approve <strong>{selectedCount}</strong> {selectedCount === 1 ? 'item' : 'items'}.<br />
          Please enter your name and 5-digit PIN to digitally sign.
        </p>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ maxWidth: '300px', margin: '0 auto 1.5rem' }}>
          <label className="form-label">Approver Name</label>
          <AutocompleteInput 
            type="user"
            value={approverName}
            onChange={setApproverName}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ maxWidth: '200px', margin: '0 auto 2rem' }}>
          <label className="form-label">5-Digit PIN</label>
          <input
            type="password"
            className="form-input"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
            maxLength={5}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="•••••"
            disabled={loading}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || pin.length !== 5 || !approverName}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Approve Items'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
