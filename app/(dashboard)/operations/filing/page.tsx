'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Plus, Download, FolderPlus, Trash2, Folder, FileIcon, FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import type { FilingEntry, FilingCategory } from '@/lib/types';

export default function FilingPage() {
  const { user } = useAuth();
  
  const [filings, setFilings] = useState<FilingEntry[]>([]);
  const [categories, setCategories] = useState<FilingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Upload Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filingsRes, categoriesRes] = await Promise.all([
        fetch('/api/filing'),
        fetch('/api/filing-categories')
      ]);

      if (filingsRes.ok) {
        const data = await filingsRes.json();
        setFilings(data.filings || []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------
  // Upload Logic
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('categoryName', selectedCategory);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/filing', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to file documents');
      }

      await fetchData(); // Refresh data
      setSelectedCategory('');
      setSelectedFiles([]);
      setIsUploadModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFiling = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this filed document?')) return;
    
    try {
      const res = await fetch(`/api/filing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFilings(prev => prev.filter(f => f._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // Category Logic
  // ----------------------------------------------------
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/filing-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add category');
      }

      const data = await res.json();
      setCategories(prev => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? (Existing files will still remain, but the category won\'t be available for new uploads)')) return;
    
    try {
      const res = await fetch(`/api/filing-categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText size={18} style={{ color: '#ef4444' }} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={18} style={{ color: '#10b981' }} />;
    if (mimeType.includes('image')) return <FileImage size={18} style={{ color: '#3b82f6' }} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={18} style={{ color: '#3b82f6' }} />;
    return <FileIcon size={18} style={{ color: 'var(--color-text-muted)' }} />;
  };

  const filteredFilings = filings.filter(f => {
    const matchesSearch = f.generatedFileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns: Column<FilingEntry>[] = [
    {
      key: 'generatedFileName', label: 'File Name', render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {getFileIcon(item.mimeType)}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.generatedFileName}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Original: {item.originalFileName}</div>
          </div>
        </div>
      ), sortable: true
    },
    { key: 'categoryName', label: 'Category', render: (item) => (
      <span style={{ background: 'var(--color-surface-hover)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 500 }}>
        {item.categoryName}
      </span>
    ), sortable: true },
    { key: 'size', label: 'Size', render: (item) => (
      <span style={{ fontSize: '0.8125rem' }}>{formatFileSize(item.size)}</span>
    ), sortable: true },
    { key: 'createdAt', label: 'Filed On', render: (item) => (
      <div>
        <div style={{ fontSize: '0.8125rem' }}>{formatDate(item.createdAt || '')}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>By: {item.uploaderName}</div>
      </div>
    ), sortable: true },
    { key: 'actions', label: '', render: (item) => (
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <a 
          href={item.fileData} 
          download={item.generatedFileName}
          className="btn btn-secondary btn-sm" 
          title="Download"
        >
          <Download size={14} /> Download
        </a>
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ color: 'var(--color-danger)' }}
            onClick={() => handleDeleteFiling(item._id as string)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    ), sortable: false }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ padding: '1.5rem', background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--color-border)', margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={24} style={{ color: 'var(--color-primary)' }} />
              Filing System
            </h1>
            <p className="page-subtitle" style={{ fontSize: '0.875rem' }}>Store and manage categorized system records with auto-generated unique filenames.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsCategoryModalOpen(true)}
              >
                <FolderPlus size={16} /> Manage Categories
              </button>
            )}
            <button 
              className="btn btn-primary" 
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={16} /> File Documents
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading filing records...
          </div>
        ) : (
          <DataTable 
            data={filteredFilings} 
            columns={columns} 
            searchFields={['generatedFileName', 'originalFileName']} 
            actions={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ fontSize: '0.875rem', padding: '0.25rem 2rem 0.25rem 0.5rem', minWidth: '150px' }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            }
          />
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setError(''); }}
        title="File New Documents"
      >
        <form onSubmit={handleUploadSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Filing Category *</label>
            <select 
              className="form-select" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                No categories available. Please ask an admin to create one.
              </p>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Files to File ({selectedFiles.length} selected)</label>
            
            <div 
              style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', textAlign: 'center', background: 'var(--color-bg-secondary)', cursor: 'pointer', marginBottom: '0.75rem' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent)' }}>Tap to browse files</div>
              <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {getFileIcon(file.type)}
                      <span style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--color-danger)', padding: '0.25rem 0.5rem' }}
                      onClick={() => removeFile(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsUploadModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || categories.length === 0}>
              {saving ? 'Filing...' : 'File Document(s)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => { setIsCategoryModalOpen(false); setError(''); }}
          title="Manage Filing Categories"
        >
          <div style={{ marginBottom: '1.5rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="New Category Name (e.g. GRNS)" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={saving || !newCategoryName.trim()}>
                Add
              </button>
            </form>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Existing Categories
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {categories.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>No categories created yet.</div>
              ) : (
                categories.map(c => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteCategory(c._id as string)}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
