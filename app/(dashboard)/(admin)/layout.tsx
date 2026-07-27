'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
    return null;
  }

  return <>{children}</>;
}
