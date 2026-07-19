'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, Eye, EyeOff, Loader2, Waves } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setError('');
        alert(`Database seeded! You can now login.\n\nDefault accounts:\n• admin@aquasafari.com / admin123\n• john@aquasafari.com / officer123\n• kwame@aquasafari.com / supervisor123\n• ama@aquasafari.com / manager123`);
      } else {
        alert(data.message || 'Seeding failed');
      }
    } catch {
      alert('Failed to seed database. Make sure MongoDB is running.');
    }
    setSeeding(false);
  };

  return (
    <div className="login-container">
      <div className="login-bg-pattern" />

      <div className="login-card">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 'var(--border-radius)',
              background: 'var(--color-accent-gradient)',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Shield size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Aqua Safari Security
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.375rem',
            }}
          >
            Control Room Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--border-radius-xs)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-danger)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="officer@aquasafari.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '0.25rem',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Seed button for first-time setup */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            First time? Set up default accounts
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={seedDatabase}
            disabled={seeding}
          >
            {seeding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Waves size={14} />
                Initialize Database
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginTop: '1.5rem',
          }}
        >
          © {new Date().getFullYear()} Aqua Safari Resort
        </p>
      </div>
    </div>
  );
}
