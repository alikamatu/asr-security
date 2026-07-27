'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { GoodsEntry } from '@/lib/types';

interface ItemPreviewSheetProps {
  isOpen: boolean;
  selectedItems: GoodsEntry[];
  onClose: () => void;
  onContinueToApprove: (remainders: { [id: string]: number }) => void;
}

export default function ItemPreviewSheet({
  isOpen,
  selectedItems,
  onClose,
  onContinueToApprove,
}: ItemPreviewSheetProps) {
  // Store remainders keyed by item ID
  const [remainders, setRemainders] = useState<{ [id: string]: number }>({});
  // Track which items have remainder toggle active
  const [hasRemainder, setHasRemainder] = useState<{ [id: string]: boolean }>({});

  // Reset state when items change or modal opens
  useEffect(() => {
    if (isOpen) {
      const initialRemainders: { [id: string]: number } = {};
      const initialHasRemainder: { [id: string]: boolean } = {};
      
      selectedItems.forEach(item => {
        if (item.hasRemainder && item.remainder !== undefined && item._id) {
          initialRemainders[item._id as string] = item.remainder;
          initialHasRemainder[item._id as string] = true;
        }
      });
      
      setRemainders(initialRemainders);
      setHasRemainder(initialHasRemainder);
    }
  }, [isOpen, selectedItems]);

  if (!isOpen) return null;

  const handleToggleRemainder = (id: string, active: boolean) => {
    setHasRemainder((prev) => ({ ...prev, [id]: active }));
    if (!active) {
      // Clear remainder if toggled off
      setRemainders((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleRemainderChange = (id: string, value: string, maxQty: number) => {
    let parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      if (parsed > maxQty) parsed = maxQty;
      setRemainders((prev) => ({ ...prev, [id]: parsed }));
    } else {
      setRemainders((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          height: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out forwards',
          // No borders, no shadows, no blur as requested
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-heading)' }}>
              Verify Selected Items
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, marginTop: '0.25rem' }}>
              Review the items before approval. Mark any discrepancies below.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ margin: '-0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
          {selectedItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
              No items selected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedItems.map((item) => {
                const itemId = item._id as string;
                const isRemainderActive = hasRemainder[itemId];
                
                return (
                  <div
                    key={itemId}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                          {item.itemDescription}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          Quantity: {item.quantity} {item.quantityUnit || 'pcs'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                        <div>From: {item.securityOfficer}</div>
                        <div>To: {item.receivedBy}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={isRemainderActive || false}
                          onChange={(e) => handleToggleRemainder(itemId, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Mark Remainder
                      </label>
                    </div>

                    {isRemainderActive && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>
                        <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
                        <div style={{ flex: 1 }}>
                          <input
                            type="number"
                            className="form-input"
                            placeholder={`Enter remainder (max ${item.quantity})...`}
                            value={remainders[itemId] !== undefined ? remainders[itemId] : ''}
                            onChange={(e) => handleRemainderChange(itemId, e.target.value, item.quantity)}
                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                            min="0"
                            max={item.quantity}
                            step="any"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedItems.length === 0}
            onClick={() => onContinueToApprove(remainders)}
          >
            <Check size={16} /> Continue to Approve
          </button>
        </div>
      </div>
    </div>
  );
}
