'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, ShieldAlert, UserCog } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { capitalize } from '@/lib/utils';
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
    department: 'Security'
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
      } else if (res.status === 403) {
        // Handle unauthorized silently here, handled by layout/rendering
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
      setUsers(prev => [...prev, data.user]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'officer', department: 'Security' });
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
    { key: 'name', label: 'Name', render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-muted)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
          {item.name.charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 500 }}>{item.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.email}</div>
        </div>
      </div>
    ), sortable: true },
    { key: 'role', label: 'Role', render: (item) => (
      <StatusBadge 
        status={item.role === 'admin' ? 'critical' : item.role === 'manager' ? 'high' : item.role === 'supervisor' ? 'medium' : 'low'} 
        size="sm" 
      />
    ), sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'isActive', label: 'Status', render: (item) => (
      item.isActive 
        ? <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>Active</span>
        : <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>Inactive</span>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system access, roles, and security personnel accounts.</p>
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
            searchFields={['name', 'email', 'role']}
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
            <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Temporary Password</label>
            <input type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} />
          </div>

          <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                <option value="officer">Control Room Officer</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Security Manager</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" className="form-input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
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
