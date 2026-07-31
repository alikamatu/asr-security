'use client';

import { useRouter } from 'next/navigation';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import PlaybackForm from '@/components/playback/PlaybackForm';
import Link from 'next/link';

export default function LogPlaybackPage() {
  const router = useRouter();

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link href="/operations/playback" className="btn btn-ghost btn-icon btn-sm" title="Back to Playback Manager">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} />
              Log CCTV Playback Incident
            </h1>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '2.5rem' }}>Record a new incident and attach corresponding footage timelines.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ padding: '2rem' }}>
          <PlaybackForm 
            onSuccess={() => router.push('/operations/playback')} 
            onCancel={() => router.push('/operations/playback')} 
          />
        </div>
      </div>
    </div>
  );
}
