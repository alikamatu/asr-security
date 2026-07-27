'use client';

import { useAuth } from '@/lib/auth-context';
import { Settings as SettingsIcon, Shield, Bell, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure your preferences and account settings.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div className="card" style={{ padding: '1rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-secondary)', color: 'var(--color-accent)' }}>
              <SettingsIcon size={18} /> General
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--color-text-muted)' }}>
              <Shield size={18} /> Security
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--color-text-muted)' }}>
              <Bell size={18} /> Notifications
            </button>
          </nav>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              Profile Information
            </h2>
            <div className="grid-form" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={user?.name || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="grid-form">
              <div className="form-group">
                <label className="form-label">Role</label>
                <input type="text" className="form-input" value={user?.role || ''} style={{ textTransform: 'capitalize' }} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-input" value="Security" disabled />
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" disabled>Update Profile</button>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              Appearance
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Customize the look and feel of the control room system. (Currently locked to Dark Mode for control room visibility).
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 'auto', padding: '1.5rem', flexDirection: 'column', gap: '0.75rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                <Moon size={24} />
                <span>Dark Mode</span>
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, height: 'auto', padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }} disabled>
                <Sun size={24} />
                <span>Light Mode</span>
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, height: 'auto', padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }} disabled>
                <Monitor size={24} />
                <span>System Sync</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
