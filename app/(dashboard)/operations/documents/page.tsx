'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Download, FileText, FileSpreadsheet, FileIcon, ShieldAlert, FileImage, ShieldCheck, Tag } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import type { DocumentEntry, DocumentSensitivity, DocumentColorLabel } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSensitivity, setFilterSensitivity] = useState<string>('all');
  const [filterColorLabel, setFilterColorLabel] = useState<string>('all');

  // Delete State
  const [documentToDelete, setDocumentToDelete] = useState<DocumentEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sensitivity, setSensitivity] = useState<DocumentSensitivity>('internal');
  const [colorLabel, setColorLabel] = useState<DocumentColorLabel>('default');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('sensitivity', sensitivity);
    formData.append('colorLabel', colorLabel);

    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload document(s)');
      }

      const data = await res.json();
      setDocuments((prev) => [data.document, ...prev]);

      // Reset form
      setTitle('');
      setDescription('');
      setSensitivity('internal');
      setColorLabel('default');
      setSelectedFiles([]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete?._id) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/documents/${documentToDelete._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete document');
      }

      setDocuments((prev) => prev.filter((d) => d._id !== documentToDelete._id));
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (doc: DocumentEntry) => {
    setDocumentToDelete(doc);
    setError('');
    setIsDeleteModalOpen(true);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText size={24} style={{ color: '#ef4444' }} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={24} style={{ color: '#10b981' }} />;
    if (mimeType.includes('image')) return <FileImage size={24} style={{ color: '#3b82f6' }} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={24} style={{ color: '#3b82f6' }} />;
    return <FileIcon size={24} style={{ color: 'var(--color-text-muted)' }} />;
  };

  const getColorLabelHex = (label: DocumentColorLabel) => {
    switch (label) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'red': return '#ef4444';
      case 'yellow': return '#f59e0b';
      case 'purple': return '#8b5cf6';
      default: return 'var(--color-surface-hover)';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSensitivity = filterSensitivity === 'all' || doc.sensitivity === filterSensitivity;
    const matchesColor = filterColorLabel === 'all' || doc.colorLabel === filterColorLabel;

    return matchesSearch && matchesSensitivity && matchesColor;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ padding: '1rem', background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--color-border)', margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>Documents</h1>
            <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Central repository for standard operating procedures, policies, and files.</p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)' }}
              onClick={() => setIsModalOpen(true)}
              title="Upload Document"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: '200px', padding: '0.5rem 1rem', borderRadius: '2rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-select"
              value={filterSensitivity}
              onChange={(e) => setFilterSensitivity(e.target.value)}
              style={{ flex: '0 1 auto', borderRadius: '2rem', padding: '0.5rem 1rem' }}
            >
              <option value="all">All Sensitivities</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
            </select>
            <select
              className="form-select"
              value={filterColorLabel}
              onChange={(e) => setFilterColorLabel(e.target.value)}
              style={{ flex: '0 1 auto', borderRadius: '2rem', padding: '0.5rem 1rem' }}
            >
              <option value="all">All Colors</option>
              <option value="default">Default</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="purple">Purple</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--color-border)' }}>
            <FileIcon size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No documents uploaded yet.</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--color-border)' }}>
            <p>No documents found matching your search criteria.</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc._id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              {doc.colorLabel !== 'default' && (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: getColorLabelHex(doc.colorLabel) }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingLeft: doc.colorLabel !== 'default' ? '0.5rem' : '0' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.title}</h3>
                {doc.sensitivity === 'confidential' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                    <ShieldAlert size={10} /> Confidential
                  </span>
                )}
                {doc.sensitivity === 'public' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                    <ShieldCheck size={10} /> Public
                  </span>
                )}

                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.125rem 0.25rem', height: 'auto', color: 'var(--color-danger)', marginLeft: '0.5rem' }}
                    onClick={() => openDeleteModal(doc)}
                    title="Delete Document"
                  >
                    Delete
                  </button>
                )}
              </div>

              {doc.description && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.4, paddingLeft: doc.colorLabel !== 'default' ? '0.5rem' : '0' }}>
                  {doc.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                {doc.files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      {getFileIcon(file.mimeType)}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.originalName}>
                          {file.originalName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={file.fileUrl}
                      download={file.originalName}
                      className="btn btn-ghost"
                      style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      title={`Download ${file.originalName}`}
                    >
                      <Download size={16} style={{ color: 'var(--color-accent)' }} />
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                <span>Uploaded by {doc.uploaderName || 'System'}</span>
                <span>{doc.createdAt ? formatDate(doc.createdAt.split('T')[0]) : 'Recently'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!saving) setIsModalOpen(false);
        }}
        title="Upload Documents"
      >
        <form onSubmit={handleSubmit} className="stagger-children">
          {error && (
            <div style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-xs)', padding: '0.75rem', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Finance Reports"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what these files contain..."
              rows={2}
            />
          </div>

          <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Sensitivity</label>
              <select
                className="form-select"
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as DocumentSensitivity)}
              >
                <option value="public">Public / All Staff</option>
                <option value="internal">Internal (Control Room)</option>
                <option value="confidential">Confidential / Restricted</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color Label</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
                <Tag size={16} style={{ marginLeft: '0.5rem', color: getColorLabelHex(colorLabel) }} />
                <select
                  className="form-select"
                  value={colorLabel}
                  onChange={(e) => setColorLabel(e.target.value as DocumentColorLabel)}
                  style={{ border: 'none', background: 'transparent', paddingLeft: '0.5rem' }}
                >
                  <option value="default">Default</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Files ({selectedFiles.length} selected)</label>

            <div
              style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', textAlign: 'center', background: 'var(--color-bg-secondary)', cursor: 'pointer', marginBottom: '0.75rem' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileIcon size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent)' }}>Tap to browse files</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PDF, Word, Excel, Images</div>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
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
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Uploading...' : 'Save Document(s)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Cute) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Document? 🗑️"
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Are you absolutely sure?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            You are about to permanently delete <strong>{documentToDelete?.title}</strong> and all of its attached files from the server.<br /><br />
            <span style={{ fontSize: '0.875rem' }}>
              (This action cannot be undone!)
            </span>
          </p>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn"
              style={{ background: 'var(--color-danger)', color: 'white', border: 'none' }}
              onClick={handleDeleteDocument}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Yes, Delete Document'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
