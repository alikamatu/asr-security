'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Download } from 'lucide-react';
import { searchFilter } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchFields?: (keyof T)[];
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
}

export default function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchFields = [],
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null);

  // Filter
  const filteredData = searchable && searchFields.length > 0 
    ? searchFilter(data, query, searchFields)
    : data;

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    // We assume string or number for sorting
    const valA = a[key as keyof T];
    const valB = b[key as keyof T];

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {searchable && (
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={String(col.key) + idx}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((item, idx) => (
                <tr 
                  key={(item as Record<string, unknown>)._id ? String((item as Record<string, unknown>)._id) : idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={String(col.key) + colIdx}>
                      {col.render ? col.render(item) : String(item[col.key as keyof T] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination summary */}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        Showing {sortedData.length} records {query ? '(filtered)' : ''}
      </div>
    </div>
  );
}
