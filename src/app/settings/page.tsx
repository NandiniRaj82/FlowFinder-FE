'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';

interface GitHubStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();

  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ connected: false });
  const [loadingGitHub, setLoadingGitHub] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [figmaConnected, setFigmaConnected] = useState(false);
  const [figmaConnectedAt, setFigmaConnectedAt] = useState<string | null>(null);
  const [figmaToken, setFigmaToken] = useState('');
  const [savingFigma, setSavingFigma] = useState(false);
  const [disconnectingFigma, setDisconnectingFigma] = useState(false);
  const [loadingFigma, setLoadingFigma] = useState(true);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    const github = searchParams.get('github');
    const username = searchParams.get('username');

    if (github === 'connected') {
      showToast(`✓ GitHub connected as @${username}`);
      api.get<any>('/api/github/status')
        .then(d => setGithubStatus(d))
        .catch(() => { });
      setLoadingGitHub(false);
      window.history.replaceState({}, '', '/settings');
    } else if (github === 'error') {
      showToast('GitHub connection failed. Please try again.', 'error');
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    api.get<any>('/api/github/status')
      .then(d => setGithubStatus(d))
      .catch(() => { })
      .finally(() => setLoadingGitHub(false));

    api.get<any>('/api/users/figma-token')
      .then(d => {
        setFigmaConnected(d.connected);
        setFigmaConnectedAt(d.connectedAt || null);
      })
      .catch(() => { })
      .finally(() => setLoadingFigma(false));
  }, [user]);

  const handleConnectGitHub = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = await auth.currentUser?.getIdToken();

    if (!token) return showToast('Please sign in again', 'error');

    window.location.href = `${apiBase}/api/github/connect?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnectGitHub = async () => {
    if (!confirm('Disconnect GitHub? You won\'t be able to generate fix PRs until you reconnect.')) return;

    setDisconnecting(true);
    try {
      await api.delete('/api/github/disconnect');
      setGithubStatus({ connected: false });
      showToast('GitHub disconnected');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveFigmaToken = async () => {
    if (!figmaToken.trim()) return showToast('Paste your Figma personal access token first.', 'error');

    setSavingFigma(true);
    try {
      await api.post('/api/users/figma-token', { accessToken: figmaToken.trim() });
      setFigmaConnected(true);
      setFigmaConnectedAt(new Date().toISOString());
      setFigmaToken('');
      showToast('Figma token saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to save token', 'error');
    } finally {
      setSavingFigma(false);
    }
  };

  const handleDisconnectFigma = async () => {
    if (!confirm('Remove your Figma token? Match Design will stop working until you add a new one.')) return;

    setDisconnectingFigma(true);
    try {
      await api.delete('/api/users/figma-token');
      setFigmaConnected(false);
      setFigmaConnectedAt(null);
      showToast('Figma token removed.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDisconnectingFigma(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: toast.type === 'success' ? '#15803d' : '#b91c1c',
          fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {toast.msg}
        </div>
      )}

      {/* keep your full existing JSX below unchanged */}
      {/* paste everything from your <header> to final <style> here */}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      Loading settings...
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}