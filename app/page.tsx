'use client';

import { useAuth } from '@/lib/auth-context';
import LoginPage from '@/components/auth/LoginPage';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardLayout from '@/app/(dashboard)/layout';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }}
          />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
