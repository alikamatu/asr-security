'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Download, Trash2, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import type { Tip } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTodayDate } from '@/lib/utils';

interface SpreadsheetRow {
  id: string;
  date: string;
  staffName: string;
  tipAmount: number;
  otherTip: string;
  source: string;
  hodName: string;
  department: string;
}

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ----------------------------------------------------
  // SpreadSheet State
  // ----------------------------------------------------
  const [rows, setRows] = useState<SpreadsheetRow[]>([
    { id: Math.random().toString(), date: getTodayDate(), staffName: '', tipAmount: 0, otherTip: '', source: '', hodName: '', department: '' }
  ]);

  const handleRowChange = (id: string, field: keyof SpreadsheetRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: Math.random().toString(), date: prev[prev.length - 1]?.date || getTodayDate(), staffName: '', tipAmount: 0, otherTip: '', source: '', hodName: '', department: prev[prev.length - 1]?.department || '' }
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
    const validRows = rows.filter(r => r.staffName.trim() !== '' && r.department.trim() !== '');
    if (validRows.length === 0) {
      setError('Please fill in Staff Name and Department for at least one row.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tips: validRows }),
      });

      if (!res.ok) {
        throw new Error('Failed to save tips');
      }

      setSuccessMsg(`Successfully saved ${validRows.length} gratuity record(s)!`);
      // Reset rows to one blank row
      setRows([{ id: Math.random().toString(), date: getTodayDate(), staffName: '', tipAmount: 0, otherTip: '', source: '', hodName: '', department: '' }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // History & Export State
  // ----------------------------------------------------
  const [history, setHistory] = useState<Tip[]>([]);
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tips?startDate=${startDate}&endDate=${endDate}`);
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

    const doc = new jsPDF('landscape'); // Landscape to fit columns
    
    doc.setFontSize(16);
    doc.text('Staff Gratuities Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, 14, 22);

    const tableData = history.map(t => [
      formatDate(t.date),
      t.staffName,
      t.department,
      t.hodName,
      t.source,
      t.otherTip || 'None',
      `GHS ${Number(t.tipAmount).toFixed(2)}`
    ]);

    // Calculate total amount
    const totalAmount = history.reduce((sum, t) => sum + Number(t.tipAmount || 0), 0);

    tableData.push([
      'TOTAL',
      '-',
      '-',
      '-',
      '-',
      '-',
      `GHS ${totalAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Date', 'Staff Name', 'Department', 'HOD Name', 'Source', 'Other Tip', 'Amount (GHS)']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] }, // Greenish theme for money
      didParseCell: (data) => {
        // Highlight the last row (Totals)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.textColor = [39, 174, 96];
        }
      }
    });

    doc.save(`Gratuities_${startDate}_to_${endDate}.pdf`);
  };

  const columns: Column<Tip>[] = [
    { key: 'date', label: 'Date', render: (item) => formatDate(item.date), sortable: true },
    { key: 'staffName', label: 'Staff Name', render: (item) => <span style={{ fontWeight: 600 }}>{item.staffName}</span>, sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'hodName', label: 'HOD Name' },
    { key: 'source', label: 'Source' },
    { key: 'otherTip', label: 'Other Tip' },
    { key: 'tipAmount', label: 'Amount (GHS)', render: (item) => <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{Number(item.tipAmount).toFixed(2)}</span>, sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Gratuities & Tips</h1>
          <p className="page-subtitle">Record and export monetary tips or gratuities given to staff.</p>
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
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Staff Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Department</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Name of HOD</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Source</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Other Tip (Items)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: '120px' }}>Tip Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="date" className="form-input" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.date} onChange={e => handleRowChange(row.id, 'date', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="text" className="form-input" placeholder="Staff Name" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.staffName} onChange={e => handleRowChange(row.id, 'staffName', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="text" className="form-input" placeholder="Department" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.department} onChange={e => handleRowChange(row.id, 'department', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="text" className="form-input" placeholder="HOD Name" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.hodName} onChange={e => handleRowChange(row.id, 'hodName', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="text" className="form-input" placeholder="Source" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.source} onChange={e => handleRowChange(row.id, 'source', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="text" className="form-input" placeholder="e.g. Gift basket" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.otherTip} onChange={e => handleRowChange(row.id, 'otherTip', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" style={{ padding: '0.375rem', fontSize: '0.875rem' }} value={row.tipAmount} onChange={e => handleRowChange(row.id, 'tipAmount', e.target.value)} />
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
                ))}
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
               searchFields={['staffName', 'department', 'source', 'hodName']} 
             />
          )}
        </div>
      )}
    </div>
  );
}
