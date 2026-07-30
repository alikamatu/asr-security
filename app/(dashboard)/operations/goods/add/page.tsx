'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { getTodayDate, getCurrentTime, DEPARTMENTS } from '@/lib/utils';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import PinVerificationModal from '@/components/goods/PinVerificationModal';
import Link from 'next/link';

const STORAGE_KEY = 'asr_goods_draft';
const VALID_UNITS = [
  'pc', 'pcs',
  'kg', 'kgs',
  'gallon', 'gallons',
  'bag', 'bags',
  'pack', 'packs',
  'litre', 'litres',
  'box', 'boxes',
  'crate', 'crates',
  'roll', 'rolls',
  'set', 'sets',
  'bottle', 'bottles',
  'carton', 'cartons',
  'tin', 'tins'
];

interface ParsedItem {
  itemDescription: string;
  quantity: number;
  quantityUnit: string;
}

interface LineError {
  lineNumber: number;
  text: string;
  missingQty: boolean;
  missingUnit: boolean;
}

function parseLine(line: string): ParsedItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Format: "Item description, quantity, unit"
  const parts = trimmed.split(',').map(p => p.trim());
  
  const itemDescription = parts[0] || '';
  if (!itemDescription) return null;
  
  const rawQtyStr = parts[1] || '';
  let quantity = 0;
  if (rawQtyStr) {
    const addends = rawQtyStr.split('+');
    quantity = addends.reduce((acc, curr) => {
      const val = parseFloat(curr.trim());
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }
  
  const rawUnit = (parts[2] || '').toLowerCase();
  const quantityUnit = VALID_UNITS.includes(rawUnit) ? rawUnit : '';
  
  return { itemDescription, quantity, quantityUnit };
}

function parseAllLines(text: string): ParsedItem[] {
  return text.split('\n')
    .map(parseLine)
    .filter((item): item is ParsedItem => item !== null);
}

function validateLines(text: string): LineError[] {
  const errors: LineError[] = [];
  text.split('\n').forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map(p => p.trim());
    const itemName = parts[0] || '';
    if (!itemName) return;
    
    const rawQtyStr = parts[1] || '';
    let qty = 0;
    if (rawQtyStr) {
      const addends = rawQtyStr.split('+');
      qty = addends.reduce((acc, curr) => {
        const val = parseFloat(curr.trim());
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    }
    const hasQty = qty > 0;
    
    const rawUnit = (parts[2] || '').toLowerCase();
    const hasUnit = VALID_UNITS.includes(rawUnit);
    
    if (!hasQty || !hasUnit) {
      errors.push({ lineNumber: idx + 1, text: trimmed, missingQty: !hasQty, missingUnit: !hasUnit });
    }
  });
  return errors;
}

interface DraftData {
  date: string;
  time: string;
  departmentReceiving: string;
  receivedBy: string;
  storesPersonName: string;
  notesText: string;
  savedAt: string;
}

export default function AddGoodsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [formData, setFormData] = useState<{
    date: string;
    time: string;
    departmentReceiving: string;
    receivedBy: string;
    storesPersonName: string;
  }>({
    date: getTodayDate(),
    time: getCurrentTime(),
    departmentReceiving: DEPARTMENTS[0],
    receivedBy: '',
    storesPersonName: '',
  });

  const [notesText, setNotesText] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsTop, setSuggestionsTop] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft: DraftData = JSON.parse(raw);
        setFormData({
          date: draft.date || getTodayDate(),
          time: draft.time || getCurrentTime(),
          departmentReceiving: draft.departmentReceiving || DEPARTMENTS[0],
          receivedBy: draft.receivedBy || '',
          storesPersonName: draft.storesPersonName || '',
        });
        setNotesText(draft.notesText || '');
        setDraftRestored(true);
        // Auto-hide the restored indicator after 3 seconds
        setTimeout(() => setDraftRestored(false), 3000);
      }
    } catch { /* ignore corrupt data */ }
    setIsInitialized(true);
  }, []);

  // Persist to localStorage on every change
  const saveDraft = useCallback(() => {
    if (!isInitialized) return; // Prevent overwriting with default state before restore completes
    try {
      const draft: DraftData = {
        ...formData,
        notesText,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [formData, notesText, isInitialized]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  // Clear draft on successful submit
  const clearDraft = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutocompleteChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch autocomplete suggestions for the current line's item name
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/autocomplete?type=item&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.options || []);
        setShowSuggestions((data.options || []).length > 0);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetch
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNotesText(newText);

    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newText.substring(0, cursorPos);
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLine = textBeforeCursor.substring(currentLineStart);
    
    const parts = currentLine.split(',');
    const activePartIndex = parts.length - 1; // 0 = item, 1 = qty, 2 = unit
    const activePartText = (parts[activePartIndex] || '').trimLeft();

    const lineIndex = textBeforeCursor.split('\n').length - 1;
    setActiveLine(lineIndex);
    
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 28;
    const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 12;
    const cursorY = paddingTop + (lineIndex + 1) * lineHeight;
    setSuggestionsTop(Math.min(cursorY, textarea.offsetHeight));
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (activePartIndex === 0) {
      // Autocomplete item
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(activePartText);
      }, 200);
    } else if (activePartIndex === 2) {
      // Autocomplete unit
      const query = activePartText.toLowerCase();
      if (query.length > 0) {
        const matches = VALID_UNITS.filter(u => u.startsWith(query)).slice(0, 5);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const text = notesText;
    const textBeforeCursor = text.substring(0, cursorPos);
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLineEnd = text.indexOf('\n', cursorPos);
    const lineEnd = currentLineEnd === -1 ? text.length : currentLineEnd;
    const currentLine = text.substring(currentLineStart, lineEnd);
    
    const parts = currentLine.split(',');
    const activePartIndex = textBeforeCursor.substring(currentLineStart).split(',').length - 1;

    let newLine = currentLine;
    let appendedText = '';

    if (activePartIndex === 0) {
      parts[0] = suggestion;
      newLine = parts.length > 1 ? parts.join(',') : suggestion + ', ';
      appendedText = parts.length > 1 ? '' : ', ';
    } else if (activePartIndex === 2) {
      parts[2] = ' ' + suggestion;
      newLine = parts.join(',');
      appendedText = '';
    }
    
    const newText = text.substring(0, currentLineStart) + newLine + text.substring(lineEnd);
    setNotesText(newText);
    setShowSuggestions(false);
    
    requestAnimationFrame(() => {
      // Find where the suggestion ends
      let newCursorPos = currentLineStart;
      if (activePartIndex === 0) {
        newCursorPos += suggestion.length + appendedText.length;
      } else if (activePartIndex === 2) {
        newCursorPos = currentLineStart + newLine.length;
      }
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(200, textareaRef.current.scrollHeight) + 'px';
    }
  }, [notesText]);

  const parsedItems = parseAllLines(notesText);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) {
      setError('Please add at least one item. Write each item on a new line: Item name, quantity, unit');
      return;
    }
    // Validate every line has qty and unit
    const lineErrors = validateLines(notesText);
    if (lineErrors.length > 0) {
      const firstErr = lineErrors[0];
      const missing = [firstErr.missingQty && 'quantity', firstErr.missingUnit && 'unit'].filter(Boolean).join(' and ');
      setError(`Line ${firstErr.lineNumber} ("${firstErr.text}") is missing ${missing}. Format: item, qty, unit`);
      return;
    }
    if (!formData.receivedBy) {
      setError('Received By is required to verify PIN.');
      return;
    }
    setError('');
    setShowPinModal(true);
  };

  const submitToServer = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        items: parsedItems,
      };

      const res = await fetch('/api/goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save entries');

      // Also log to OB
      await fetch('/api/ob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          category: 'goods',
          priority: 'low',
          entry: `Goods Received: ${parsedItems.length} items for ${formData.departmentReceiving}.`,
        }),
      });

      clearDraft();
      router.push('/operations/goods');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/operations/goods" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={14} /> Back to Goods
        </Link>
        <h1 className="page-title">Log Received Goods</h1>
      </div>

      <form onSubmit={handleInitialSubmit}>
        {/* Receipt Details */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="grid-form" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-input" value={formData.date} onChange={handleMetadataChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" name="time" className="form-input" value={formData.time} onChange={handleMetadataChange} required />
            </div>
          </div>

          <div className="grid-form" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select name="departmentReceiving" className="form-select" value={formData.departmentReceiving} onChange={handleMetadataChange} required>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stores Person</label>
              <AutocompleteInput 
                type="storesPerson"
                name="storesPersonName"
                value={formData.storesPersonName} 
                onChange={(val) => handleAutocompleteChange('storesPersonName', val)} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Received By</label>
            <AutocompleteInput 
              type="user"
              name="receivedBy"
              value={formData.receivedBy} 
              onChange={(val) => handleAutocompleteChange('receivedBy', val)} 
              required 
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              This person will enter their PIN to sign.
            </span>
          </div>
        </div>

        {/* Notes-style Items Input */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '1rem',
          marginBottom: '1rem',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
                Items
              </span>
            </div>
            {parsedItems.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'var(--color-accent-muted)', padding: '0.125rem 0.5rem', borderRadius: 'var(--border-radius-pill)' }}>
                {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              className="form-textarea"
              value={notesText}
              onChange={handleNotesChange}
              placeholder={`Type each item on a new line:\nSugar, 5, kg\nMilk, 2, gallon\nPlastic cups, 100, pcs\nCooking oil, 3.5, litre`}
              style={{
                minHeight: '200px',
                fontSize: '1rem',
                lineHeight: '1.75',
                fontFamily: 'var(--font-body)',
                resize: 'none',
                background: 'var(--color-bg-primary)',
                borderRadius: 'var(--border-radius-xs)',
                padding: '0.75rem 1rem',
                border: 'none',
                width: '100%',
                outline: 'none',
              }}
            />

            {/* Autocomplete Suggestions — positioned near cursor */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  right: '0.5rem',
                  top: `${suggestionsTop}px`,
                  zIndex: 60,
                  background: 'var(--color-bg-primary)',
                  borderRadius: 'var(--border-radius-xs)',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  listStyle: 'none',
                  padding: 0,
                  border: '1px solid var(--color-border)',
                }}
              >
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => applySuggestion(s)}
                    style={{
                      padding: '0.625rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-primary)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Format: <strong>item, qty, unit</strong> &nbsp;·&nbsp; One per line &nbsp;·&nbsp; Units: pcs, kg, gallon, bag, pack, litre, box, crate, roll, set
          </div>
        </div>

        {/* Parsed Items Preview */}
        {parsedItems.length > 0 && (
          <div style={{
            marginBottom: '1.25rem',
            borderRadius: 'var(--border-radius-xs)',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preview
            </div>
            {parsedItems.map((item, idx) => {
              const isIncomplete = !item.quantity || !item.quantityUnit;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: idx < parsedItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.itemDescription}</span>
                  <span style={{ 
                    fontSize: '0.8125rem', whiteSpace: 'nowrap', marginLeft: '1rem',
                    color: isIncomplete ? 'var(--color-danger)' : 'var(--color-text-muted)',
                  }}>
                    {item.quantity || '?'} {item.quantityUnit || '?'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Draft restored indicator */}
        {draftRestored && (
          <div style={{
            fontSize: '0.75rem', color: 'var(--color-success)', textAlign: 'center', marginBottom: '0.75rem',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            ✓ Draft restored from your last session
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <Link href="/operations/goods" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.625rem' }}
            onClick={() => {
              setNotesText('');
              setFormData(prev => ({ ...prev, receivedBy: '', storesPersonName: '' }));
              clearDraft();
            }}
            title="Clear all"
          >
            <Trash2 size={16} />
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || parsedItems.length === 0} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              `Sign & Submit (${parsedItems.length})`
            )}
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
