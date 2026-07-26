'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface PinVerificationModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinVerificationModal({
  isOpen,
  userName,
  onClose,
  onSuccess,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 5) {
      setError('PIN must be 5 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, pin }),
      });

      if (res.ok) {
        onSuccess(); // PIN verified successfully
        setPin(''); // clear PIN for next time
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid PIN. Please try again.');
        setPin(''); // clear PIN to retry
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Signature Required" size="md">
      <form onSubmit={handleSubmit} className="stagger-children" style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Please ask <strong>{userName}</strong> to enter their 5-digit PIN to digitally sign this receipt.
        </p>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ maxWidth: '200px', margin: '0 auto 2rem' }}>
          <input
            type="password"
            className="form-input"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
            maxLength={5}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="•••••"
            autoFocus
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || pin.length !== 5}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign & Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
