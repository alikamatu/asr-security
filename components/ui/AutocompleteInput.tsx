'use client';

import { useState, useEffect, useRef } from 'react';

// Let's implement debounce inline or create a simple hook
export function useDebounceHook<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  type: 'item' | 'user' | 'storesPerson' | 'supplier' | 'deliveryCompany';
  value: string;
  onChange: (value: string) => void;
  onOptionSelect?: (value: string) => void;
}

export default function AutocompleteInput({
  type,
  value,
  onChange,
  onOptionSelect,
  className = "form-input",
  ...props
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedValue = useDebounceHook(value, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedValue || !isOpen) {
      setOptions([]);
      return;
    }
    
    let isMounted = true;
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?type=${type}&query=${encodeURIComponent(debouncedValue)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOptions(data.options || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch options', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchOptions();
    
    return () => {
      isMounted = false;
    };
  }, [debouncedValue, type, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        {...props}
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (value) setIsOpen(true);
        }}
      />
      {isOpen && options.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            marginTop: '0.25rem',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {options.map((option, idx) => (
            <li
              key={idx}
              onClick={() => {
                onChange(option);
                if (onOptionSelect) onOptionSelect(option);
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderBottom: idx === options.length - 1 ? 'none' : '1px solid var(--color-border)',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
