'use client';

import { useEffect, useState } from 'react';
import { Plus, ShieldAlert, KeyRound } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer',
    department: 'Security',
    signatureCode: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchUsers();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!/^\d{5}$/.test(formData.signatureCode)) {
      setError('Digital signature code must be exactly 5 numeric digits (e.g. 12345)');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create user');
      }

      const data = await res.json();
      setUsers((prev) => [...prev, data.user]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'officer',
        department: 'Security',
        signatureCode: '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Only Administrators and Managers can access the User Management portal.
        </p>
      </div>
    );
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--color-accent-muted)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {item.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{item.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (item) => (
        <StatusBadge
          status={
            item.role === 'admin'
              ? 'critical'
              : item.role === 'manager'
              ? 'high'
              : item.role === 'supervisor'
              ? 'medium'
              : 'low'
          }
          size="sm"
        />
      ),
      sortable: true,
    },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'signatureCode',
      label: 'Digital Signature Code',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <KeyRound size={14} style={{ color: 'var(--color-accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '0.08em',
              background: 'var(--color-bg-tertiary)',
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--border-radius-xs)',
              border: '1px solid var(--color-border)',
            }}
          >
            {item.signatureCode || 'N/A'}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) =>
        item.isActive ? (
          <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>Active</span>
        ) : (
          <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>Inactive</span>
        ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system access, roles, and digital signature codes.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Add User
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading users...
          </div>
        ) : (
          <DataTable
            data={users}
            columns={columns}
            searchFields={['name', 'email', 'role', 'department', 'signatureCode']}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleSubmit} className="stagger-children">
          {error && (
            <div
              style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--border-radius-xs)',
                padding: '0.75rem 1rem',
                color: 'var(--color-danger)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Samuel Kojo"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="user@aquasafari.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">5-Digit Digital Signature Code</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={formData.signatureCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setFormData({ ...formData, signatureCode: val });
                }}
                required
                maxLength={5}
                placeholder="e.g. 54321"
                style={{ paddingLeft: '2.5rem', letterSpacing: '0.1em', fontWeight: 600 }}
              />
              <KeyRound
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-accent)',
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Assign a unique 5-digit PIN code for digital signature verification.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Temporary Password</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Min 6 characters"
            />
          </div>

          <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="officer">Control Room Officer</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Security Manager</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
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
              {saving ? 'Saving...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
