'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Download, Trash2, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import type { Visitor } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTodayDate } from '@/lib/utils';

interface SpreadsheetRow {
  id: string;
  date: string;
  name: string;
  address: string;
  country: string;
  phoneNumber: string;
  adults: number;
  kids: number;
  kidsUnderSix: number;
}

export default function VisitorsPage() {
  const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ----------------------------------------------------
  // SpreadSheet State
  // ----------------------------------------------------
  const [rows, setRows] = useState<SpreadsheetRow[]>([
    { id: Math.random().toString(), date: getTodayDate(), name: '', address: '', country: '', phoneNumber: '', adults: 1, kids: 0, kidsUnderSix: 0 }
  ]);

  const handleRowChange = (id: string, field: keyof SpreadsheetRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: Math.random().toString(), date: prev[prev.length - 1]?.date || getTodayDate(), name: '', address: '', country: '', phoneNumber: '', adults: 1, kids: 0, kidsUnderSix: 0 }
    ]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveRows = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Validate rows
    const validRows = rows.filter(r => r.name.trim() !== '' && r.country.trim() !== '');
    if (validRows.length === 0) {
      setError('Please fill in Name and Country for at least one row.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitors: validRows }),
      });

      if (!res.ok) {
        throw new Error('Failed to save visitors');
      }

      setSuccessMsg(`Successfully saved ${validRows.length} foreign visitor(s)!`);
      // Reset rows to one blank row
      setRows([{ id: Math.random().toString(), date: getTodayDate(), name: '', address: '', country: '', phoneNumber: '', adults: 1, kids: 0, kidsUnderSix: 0 }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // History & Export State
  // ----------------------------------------------------
  const [history, setHistory] = useState<Visitor[]>([]);
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/visitors?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.entries || []);
      } else {
        throw new Error('Failed to fetch history');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const exportPDF = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Foreign Visitors Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, 14, 22);

    const tableData = history.map(v => [
      formatDate(v.date),
      v.name,
      v.address || 'N/A',
      v.country,
      v.phoneNumber || 'N/A',
      v.adults.toString(),
      v.kids.toString(),
      v.kidsUnderSix.toString(),
      v.total.toString()
    ]);

    // Calculate totals
    const totalAdults = history.reduce((sum, v) => sum + v.adults, 0);
    const totalKids = history.reduce((sum, v) => sum + v.kids, 0);
    const totalKidsUnder6 = history.reduce((sum, v) => sum + v.kidsUnderSix, 0);
    const totalVisitors = history.reduce((sum, v) => sum + v.total, 0);

    tableData.push([
      'TOTALS',
      '-',
      '-',
      '-',
      '-',
      totalAdults.toString(),
      totalKids.toString(),
      totalKidsUnder6.toString(),
      totalVisitors.toString()
    ]);

    autoTable(doc, {
      head: [['Date', 'Name', 'Address', 'Country', 'Phone', 'Adults', 'Kids', 'Kids < 6', 'Total']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      didParseCell: (data) => {
        // Highlight the last row (Totals)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    doc.save(`Foreign_Visitors_${startDate}_to_${endDate}.pdf`);
  };

  const columns: Column<Visitor>[] = [
    { key: 'date', label: 'Date', render: (item) => formatDate(item.date), sortable: true },
    { key: 'name', label: 'Name', render: (item) => <span style={{ fontWeight: 600 }}>{item.name}</span>, sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'country', label: 'Country', sortable: true },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'adults', label: 'Adults', render: (item) => <span style={{ textAlign: 'center', display: 'block' }}>{item.adults}</span> },
    { key: 'kids', label: 'Kids', render: (item) => <span style={{ textAlign: 'center', display: 'block' }}>{item.kids}</span> },
    { key: 'kidsUnderSix', label: 'Kids < 6', render: (item) => <span style={{ textAlign: 'center', display: 'block' }}>{item.kidsUnderSix}</span> },
    { key: 'total', label: 'Total', render: (item) => <span style={{ fontWeight: 600, color: 'var(--color-primary)', textAlign: 'center', display: 'block' }}>{item.total}</span>, sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Foreign Visitors Register</h1>
          <p className="page-subtitle">Record and export foreign visitor statistics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.25rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)' }}>
          <button 
            className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('entry')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <FileSpreadsheet size={16} /> Data Entry
          </button>
          <button 
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('history')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <FileText size={16} /> History & Export
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="card">
          <div style={{ overflowX: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Address</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Country</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Phone Number</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: '80px' }}>Adults</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: '80px' }}>Kids</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: '90px' }}>Kids &lt; 6</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: '80px' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const total = Number(row.adults) + Number(row.kids) + Number(row.kidsUnderSix);
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="date" className="form-input" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.date} onChange={e => handleRowChange(row.id, 'date', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="text" className="form-input" placeholder="Name" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.name} onChange={e => handleRowChange(row.id, 'name', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="text" className="form-input" placeholder="Address" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.address} onChange={e => handleRowChange(row.id, 'address', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="text" className="form-input" placeholder="Country" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.country} onChange={e => handleRowChange(row.id, 'country', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="text" className="form-input" placeholder="Phone" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.phoneNumber} onChange={e => handleRowChange(row.id, 'phoneNumber', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" min="0" className="form-input" style={{ padding: '0.375rem', fontSize: '0.875rem', textAlign: 'center' }} value={row.adults} onChange={e => handleRowChange(row.id, 'adults', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" min="0" className="form-input" style={{ padding: '0.375rem', fontSize: '0.875rem', textAlign: 'center' }} value={row.kids} onChange={e => handleRowChange(row.id, 'kids', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" min="0" className="form-input" style={{ padding: '0.375rem', fontSize: '0.875rem', textAlign: 'center' }} value={row.kidsUnderSix} onChange={e => handleRowChange(row.id, 'kidsUnderSix', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {total}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--color-danger)', padding: '0.25rem' }}
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div style={{ padding: '1rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={addRow}>
                <Plus size={14} /> Add Row
              </button>
              
              <button className="btn btn-primary" onClick={handleSaveRows} disabled={loading}>
                <Save size={16} /> {loading ? 'Saving...' : 'Save All Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>End Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={fetchHistory} disabled={loading}>
                Filter
              </button>
            </div>
            
            <button className="btn btn-secondary" onClick={exportPDF} disabled={history.length === 0}>
              <Download size={16} /> Export PDF
            </button>
          </div>
          
          {loading ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading history...</div>
          ) : (
             <DataTable 
               data={history} 
               columns={columns} 
               searchFields={['name', 'country']} 
             />
          )}
        </div>
      )}
    </div>
  );
}
