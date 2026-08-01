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

  // Edit & Delete State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    if (currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superadmin') {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?._id) return;

    setSaving(true);
    setError('');

    // If signature code is not empty, validate it
    if (formData.signatureCode && !/^\d{5}$/.test(formData.signatureCode)) {
      setError('Digital signature code must be exactly 5 numeric digits (e.g. 12345)');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Only send password if it's changed
          password: formData.password || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user');
      }

      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? data.user : u)));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      // Reset form data for next use
      setFormData({
        name: '', email: '', password: '', role: 'officer', department: 'Security', signatureCode: ''
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      department: user.department || 'Security',
      signatureCode: user.signatureCode || '',
    });
    // Add isActive state property dynamically to formData for the edit form
    // @ts-ignore
    setFormData((prev) => ({ ...prev, isActive: user.isActive }));
    setError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setError('');
    setIsDeleteModalOpen(true);
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager' && currentUser?.role !== 'superadmin') {
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
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem 0.5rem' }}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }}
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(item);
            }}
          >
            Delete
          </button>
        </div>
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

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit User: ${selectedUser?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="stagger-children">
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
                maxLength={5}
                placeholder="Leave blank to remove"
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
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">New Password (Optional)</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current password"
              minLength={6}
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
                <option value="superadmin">Super Administrator</option>
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

          <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isActive"
              // @ts-ignore
              checked={formData.isActive ?? true}
              onChange={(e) => {
                // @ts-ignore
                setFormData({ ...formData, isActive: e.target.checked })
              }}
              style={{ width: '1rem', height: '1rem' }}
            />
            <label htmlFor="isActive" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
              Account is Active
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0 1.5rem', flexBasis: '100%' }}>
              Unchecking this will disable their ability to log in without deleting their data.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Cute) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Saying Goodbye! 👋"
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
            You are about to permanently delete <strong>{selectedUser?.name}</strong> from the system.<br /><br />
            <span style={{ fontSize: '0.875rem' }}>
              (Don't worry! Any goods they received or logs they created will safely remain intact in the system archives.)
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
              onClick={handleDeleteUser}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Yes, Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
