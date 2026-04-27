'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Dashboard from '../components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [githubToast, setGithubToast] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    api.get<any>('/api/github/status')
      .then(d => setGithubConnected(d.connected ?? false))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    const github = searchParams.get('github');
    const username = searchParams.get('username');

    if (github === 'connected') {
      setGithubToast(`✓ GitHub connected as @${username}`);
      setGithubConnected(true);
      setTimeout(() => setGithubToast(null), 5000);
      window.history.replaceState({}, '', '/dashboard');
    } else if (github === 'error') {
      setGithubToast('GitHub connection failed. Please try again.');
      setTimeout(() => setGithubToast(null), 5000);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading || !user) {
    return <DashboardLoading />;
  }

  const userForDashboard = {
    fullName: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    uid: user.uid,
    photoURL: user.photoURL,
  };

  return (
    <>
      {githubToast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px',
          background: githubToast.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${githubToast.startsWith('✓') ? '#86efac' : '#fca5a5'}`,
          color: githubToast.startsWith('✓') ? '#15803d' : '#b91c1c',
          fontWeight: 600, fontSize: '14px', fontFamily: 'Inter,sans-serif',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {githubToast}
        </div>
      )}

      <Dashboard user={userForDashboard} githubConnected={githubConnected} />

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(20px); }
          to { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </>
  );
}

function DashboardLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#fff7ed,#fffbeb,#fff)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '52px',
          height: '52px',
          border: '4px solid #fed7aa',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{
          color: '#64748b',
          fontWeight: 600,
          fontFamily: 'Inter,sans-serif'
        }}>
          Loading FlowFinder...
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}