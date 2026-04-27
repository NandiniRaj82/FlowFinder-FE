'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ connected: false });
  // Ref flag: set to true when we handle an OAuth callback so the [user]
  // effect doesn't fire a competing /status fetch and overwrite optimistic state.
  // useRef survives re-renders (unlike state) without causing extra renders.
  const oauthCallbackHandled = useRef(false);
  const [loadingGitHub, setLoadingGitHub] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Figma token state
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [figmaConnectedAt, setFigmaConnectedAt] = useState<string | null>(null);
  const [figmaToken, setFigmaToken] = useState('');
  const [savingFigma, setSavingFigma] = useState(false);
  const [disconnectingFigma, setDisconnectingFigma] = useState(false);
  const [loadingFigma, setLoadingFigma] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // Handle OAuth callback redirect params (?github=connected or ?github=error)
  useEffect(() => {
    const github = searchParams.get('github');
    const username = searchParams.get('username');

    if (github === 'connected') {
      // Mark BEFORE cleaning URL — window.history.replaceState triggers a
      // Next.js re-render that empties searchParams, so the [user] effect
      // can no longer check searchParams.get('github'). The ref survives.
      oauthCallbackHandled.current = true;

      setGithubStatus({ connected: true, username: username || undefined });
      setLoadingGitHub(false);
      showToast(`✓ GitHub connected as @${username}`);
      window.history.replaceState({}, '', '/settings');

      // Refresh with full server data after DB write settles
      setTimeout(() => {
        api.get<any>('/api/github/status')
          .then(d => { if (d?.connected) setGithubStatus(d); })
          .catch(() => { });
      }, 1000);

    } else if (github === 'error') {
      setLoadingGitHub(false);
      showToast('GitHub connection failed. Please try again.', 'error');
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    // If an OAuth callback was just handled, skip — the [searchParams] effect
    // already set optimistic state and scheduled a delayed /status refresh.
    // The ref is reliable even after replaceState empties searchParams.
    if (oauthCallbackHandled.current) return;

    api.get<any>('/api/github/status')
      .then(d => setGithubStatus(d))
      .catch(() => { })
      .finally(() => setLoadingGitHub(false));
    // Also fetch Figma token status
    api.get<any>('/api/users/figma-token')
      .then(d => { setFigmaConnected(d.connected); setFigmaConnectedAt(d.connectedAt || null); })
      .catch(() => { })
      .finally(() => setLoadingFigma(false));
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConnectGitHub = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = await auth.currentUser?.getIdToken();
    if (!token) return showToast('Please sign in again', 'error');
    // Pass token as query param — browser redirects can't send Authorization headers
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
    } finally { setSavingFigma(false); }
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
    } finally { setDisconnectingFigma(false); }
  };

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
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

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Settings</h1>
        </div>
      </header>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Profile card */}
        <section style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 18px' }}>Account</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #e2e8f0' }} />
            ) : (
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
              </div>
            )}
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{user.displayName || 'User'}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{user.email}</p>
            </div>
            <button onClick={handleSignOut} style={{ marginLeft: 'auto', padding: '8px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', cursor: 'pointer', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
              Sign Out
            </button>
          </div>
        </section>

        {/* GitHub connection card */}
        <section style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <svg width="20" height="20" fill="#1e293b" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>GitHub Connection</h2>
          </div>

          {loadingGitHub ? (
            <div style={{ height: '80px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '10px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
          ) : githubStatus.connected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', marginBottom: '16px' }}>
                {githubStatus.avatarUrl && (
                  <img src={githubStatus.avatarUrl} alt="GitHub" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#15803d' }}>Connected</p>
                    <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, borderRadius: '20px' }}>Active</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>@{githubStatus.username}</p>
                  {githubStatus.connectedAt && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#4ade80' }}>
                      Connected {new Date(githubStatus.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.6 }}>
                GitHub is connected with <strong>repo</strong> scope. FlowFinder can read your repositories, create branches, and open pull requests for accessibility and design fixes.
              </p>
              <button onClick={handleDisconnectGitHub} disabled={disconnecting} style={{ padding: '9px 18px', background: disconnecting ? '#f1f5f9' : '#fef2f2', border: `1.5px solid ${disconnecting ? '#e2e8f0' : '#fecaca'}`, borderRadius: '10px', cursor: disconnecting ? 'not-allowed' : 'pointer', color: disconnecting ? '#94a3b8' : '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
                {disconnecting ? 'Disconnecting...' : 'Disconnect GitHub'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ padding: '16px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: '14px' }}>⚠ GitHub not connected</p>
                <p style={{ margin: 0, color: '#a16207', fontSize: '13px', lineHeight: 1.5 }}>
                  Connect GitHub to unlock the full fix & PR workflow. FlowFinder will be able to read your repositories and create pull requests.
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.6 }}>
                You'll be redirected to GitHub to authorize access. FlowFinder requests <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>repo</code> and <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>read:user</code> scopes only.
              </p>
              <button onClick={handleConnectGitHub} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: '#1e293b', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                Connect GitHub
              </button>
            </div>
          )}
        </section>

        {/* Figma token card */}
        <section style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Figma Integration</h2>
          </div>

          {loadingFigma ? (
            <div style={{ height: 80, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: 10, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ) : figmaConnected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, marginBottom: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#15803d' }}>Figma token connected</p>
                  {figmaConnectedAt && <p style={{ margin: 0, fontSize: 12, color: '#4ade80' }}>Added {new Date(figmaConnectedAt).toLocaleDateString()}</p>}
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>Your personal Figma access token is stored securely. The Match Design feature uses it to fetch your Figma frames.</p>
              <button onClick={handleDisconnectFigma} disabled={disconnectingFigma}
                style={{ padding: '9px 18px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, cursor: disconnectingFigma ? 'not-allowed' : 'pointer', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
                {disconnectingFigma ? 'Removing...' : 'Remove Figma Token'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ padding: '14px 16px', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#5b21b6', fontSize: 14 }}>Figma token required</p>
                <p style={{ margin: 0, color: '#7c3aed', fontSize: 13, lineHeight: 1.5 }}>Match Design needs a personal Figma access token to export your design frames. Get one at figma.com/settings under Personal access tokens.</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="password"
                  value={figmaToken}
                  onChange={e => setFigmaToken(e.target.value)}
                  placeholder="figd_xxxxxxxxxxxx..."
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd6fe', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                />
                <button onClick={handleSaveFigmaToken} disabled={savingFigma || !figmaToken.trim()}
                  style={{ padding: '10px 18px', background: !figmaToken.trim() || savingFigma ? '#e2e8f0' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 10, cursor: !figmaToken.trim() || savingFigma ? 'not-allowed' : 'pointer', color: !figmaToken.trim() || savingFigma ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 700 }}>
                  {savingFigma ? 'Saving...' : 'Save Token'}
                </button>
              </div>
              <p style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>Your token is stored encrypted and never shared.</p>
            </div>
          )}
        </section>

        {/* Feature permissions explainer */}
        <section style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>What FlowFinder can access</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🔍', title: 'Read repositories', desc: 'Browse your repos and read source files to map accessibility errors', scope: 'repo (read)' },
              { icon: '🌿', title: 'Create branches', desc: 'Create fix branches like flowfinder/a11y-fixes-2026-04-21', scope: 'repo (write)' },
              { icon: '📋', title: 'Open pull requests', desc: 'Submit PRs with your reviewed and accepted fixes', scope: 'repo (write)' },
              { icon: '👤', title: 'Read profile', desc: 'Display your GitHub username and avatar in the UI', scope: 'read:user' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.title}</p>
                    <code style={{ fontSize: '11px', padding: '1px 6px', background: '#e2e8f0', color: '#475569', borderRadius: '4px' }}>{item.scope}</code>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section style={{ background: '#fff', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#b91c1c', margin: '0 0 12px' }}>Danger Zone</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.6 }}>
            Signing out will clear your local session. Your scan history and settings are safely stored in the cloud.
          </p>
          <button onClick={handleSignOut} style={{ padding: '9px 18px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', cursor: 'pointer', color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>
            Sign Out
          </button>
        </section>
      </main>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}
