'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { syncAuthTokenToExtension } from '@/app/components/extensionBridge';
import ScanHistory from '@/app/components/accessibility/ScanHistory';
import ScanDetails from '@/app/components/accessibility/ScanDetails';

type View = 'history' | 'details' | 'fixes';

export default function AccessibilityPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('history');
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');

  // Sync Firebase token to extension after load
  useEffect(() => {
    const syncToken = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        syncAuthTokenToExtension(token).catch(() => { });
      }
    };
    syncToken();
  }, []);

  // Check GitHub connection status
  useEffect(() => {
    if (!user) return;
    api.get<any>('/api/github/status').then(r => {
      setGithubConnected(r.connected);
      setGithubUsername(r.username || '');
    }).catch(() => { });
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push('/');

  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleSelectScan = (scanId: string) => {
    setSelectedScanId(scanId);
    setView('details');
  };

  const handleBack = () => {
    if (view === 'details') { setView('history'); setSelectedScanId(null); }
    else if (view === 'fixes') setView('details');
  };

  const handleConnectGitHub = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    // Pass token as query param — browser redirects can't send Authorization headers
    window.location.href = `${apiBase}/api/github/connect?token=${encodeURIComponent(token)}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f3e8', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Nav */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {view !== 'history' && (
            <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Accessibility Fixer</h1>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                {view === 'history' ? 'Scan history' : view === 'details' ? 'Scan details' : 'Fix & raise PR'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* GitHub status */}
          {githubConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px' }}>
              <svg width="16" height="16" fill="#22c55e" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>@{githubUsername}</span>
            </div>
          ) : (
            <button onClick={handleConnectGitHub} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#1e293b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Connect GitHub
            </button>
          )}

          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {view === 'history' && (
          <ScanHistory onSelectScan={handleSelectScan} githubConnected={githubConnected} onConnectGitHub={handleConnectGitHub} />
        )}
        {view === 'details' && selectedScanId && (
          <ScanDetails
            scanId={selectedScanId}
            githubConnected={githubConnected}
            githubUsername={githubUsername}
            onConnectGitHub={handleConnectGitHub}
          />
        )}
      </main>
    </div>
  );
}
