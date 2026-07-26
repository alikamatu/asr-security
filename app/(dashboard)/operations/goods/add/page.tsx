'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS } from '@/lib/utils';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import PinVerificationModal from '@/components/goods/PinVerificationModal';
import Link from 'next/link';

interface GoodsItem {
  itemDescription: string;
  quantity: number;
  quantityUnit: string;
}

export default function AddGoodsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    departmentReceiving: DEPARTMENTS[0],
    receivedBy: '',
    storesPersonName: '',
  });

  const [items, setItems] = useState<GoodsItem[]>([
    { itemDescription: '', quantity: 1, quantityUnit: 'pcs' },
  ]);

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutocompleteChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof GoodsItem, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { itemDescription: '', quantity: 1, quantityUnit: 'pcs' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(item => !item.itemDescription || item.quantity <= 0)) {
      setError('Please ensure all items have a description and valid quantity.');
      return;
    }
    if (!formData.receivedBy) {
      setError('Received By is required to verify PIN.');
      return;
    }
    setShowPinModal(true);
  };

  const submitToServer = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        items,
      };

      const res = await fetch('/api/goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save entries');
      }

      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          category: 'goods',
          priority: 'low',
          entry: `Goods Received: ${items.length} items for ${formData.departmentReceiving}.`,
        }),
      });

      router.push('/operations/goods');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/operations/goods" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={14} /> Back to Goods
          </Link>
          <h1 className="page-title">Log Received Goods</h1>
          <p className="page-subtitle">Record incoming deliveries and supplies.</p>
        </div>
      </div>

      <form onSubmit={handleInitialSubmit}>
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            Receipt Details
          </h2>
          
          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="grid-form" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-input" value={formData.date} onChange={handleMetadataChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" name="time" className="form-input" value={formData.time} onChange={handleMetadataChange} required />
            </div>
          </div>

          <div className="grid-form" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department Receiving</label>
              <select name="departmentReceiving" className="form-select" value={formData.departmentReceiving} onChange={handleMetadataChange} required>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stores Person Name</label>
              <AutocompleteInput 
                type="storesPerson"
                name="storesPersonName"
                value={formData.storesPersonName} 
                onChange={(val) => handleAutocompleteChange('storesPersonName', val)} 
              />
            </div>
          </div>

          <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Received By (Staff Name)</label>
              <AutocompleteInput 
                type="user"
                name="receivedBy"
                value={formData.receivedBy} 
                onChange={(val) => handleAutocompleteChange('receivedBy', val)} 
                required 
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                * This person will need to enter their PIN to sign.
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              Items Received
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '0.5rem' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Item Description</label>
                  <AutocompleteInput 
                    type="item"
                    value={item.itemDescription}
                    onChange={(val) => handleItemChange(idx, 'itemDescription', val)}
                    required
                  />
                </div>
                <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit</label>
                  <select 
                    className="form-select" 
                    value={item.quantityUnit} 
                    onChange={(e) => handleItemChange(idx, 'quantityUnit', e.target.value)}
                  >
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="gallon">Gallon</option>
                    <option value="bag">Bag</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(idx)}
                    style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.5rem' }}
                    title="Remove Item"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>



        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/operations/goods" className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
            Proceed to Sign
          </button>
        </div>
      </form>

      {showPinModal && (
        <PinVerificationModal
          isOpen={showPinModal}
          userName={formData.receivedBy}
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setShowPinModal(false);
            submitToServer();
          }}
        />
      )}
    </div>
  );
}
