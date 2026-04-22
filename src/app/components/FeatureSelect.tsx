'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface FeatureSelectProps {
  user?: { fullName: string; email: string; photoURL?: string | null };
  onSelect: (feature: 'accessibility' | 'match-design' | 'website-redesigner') => void;
}

interface DashboardStats {
  totalScans: number;
  totalErrors: number;
  prRaisedCount: number;
  totalIssuesFixed: number;
  avgAccessibility: number;
  scansThisWeek: number;
  totalFilesFixed: number;
  github: { connected: boolean; username?: string; avatarUrl?: string };
}

interface RecentScan {
  _id: string;
  websiteUrl: string;
  totalErrors: number;
  scores?: { accessibility?: number; performance?: number; seo?: number };
  source: string;
  createdAt: string;
}

interface RecentFix {
  _id: string;
  repoFullName: string;
  status: string;
  totalFilesChanged: number;
  totalFixesApplied: number;
  prUrl?: string;
  prNumber?: number;
  createdAt: string;
}

const scoreColor = (s?: number) => {
  if (!s && s !== 0) return '#94a3b8';
  if (s >= 90) return '#22c55e';
  if (s >= 70) return '#f59e0b';
  return '#ef4444';
};

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  review: { bg: '#fef9c3', color: '#a16207', label: 'In Review' },
  pr_created: { bg: '#f0fdf4', color: '#15803d', label: 'PR Created' },
  creating_pr: { bg: '#eff6ff', color: '#1d4ed8', label: 'Creating PR…' },
  error: { bg: '#fef2f2', color: '#b91c1c', label: 'Error' },
  generating: { bg: '#faf5ff', color: '#7e22ce', label: 'Generating' },
  mapping: { bg: '#fff7ed', color: '#c2410c', label: 'Mapping' },
};

export default function FeatureSelect({ user, onSelect }: FeatureSelectProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [recentFixes, setRecentFixes] = useState<RecentFix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/api/dashboard/stats')
      .then(d => {
        setStats(d.stats);
        setRecentScans(d.recentScans || []);
        setRecentFixes(d.recentFixes || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await signOut(); router.push('/signin'); };

  const metrics = [
    { label: 'Total Scans', value: stats?.totalScans ?? '—', color: '#ea580c' },
    { label: 'Issues Found', value: stats?.totalErrors ?? '—', color: '#ef4444' },
    { label: 'Issues Fixed', value: stats?.totalIssuesFixed ?? '—', color: '#22c55e' },
    { label: 'PRs Raised', value: stats?.prRaisedCount ?? '—', color: '#6366f1' },
    { label: 'Design Scans', value: (stats as any)?.totalDesignScans ?? '—', color: '#7c3aed' },
    { label: 'Avg Match Score', value: (stats as any)?.avgMatchScore ? `${(stats as any).avgMatchScore}%` : '—', color: '#0891b2' },
  ];

  const features = [
    {
      key: 'accessibility' as const,
      label: 'Fix Accessibility',
      desc: 'Scan pages, map to source, open PRs',
      grad: 'linear-gradient(135deg,#ea580c,#f59e0b)',
      svgIcon: (
        <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 9h14M12 9v11M8 14l4 2 4-2" /></svg>
      ),
      action: () => router.push('/dashboard/accessibility'),
    },
    {
      key: 'match-design' as const,
      label: 'Match Design',
      desc: 'Pixel-diff live site vs Figma design',
      grad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
      svgIcon: (
        <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
      ),
      action: () => onSelect('match-design'),
    },
    {
      key: 'website-redesigner' as const,
      label: 'Redesigner',
      desc: 'Generate AI redesign variants instantly',
      grad: 'linear-gradient(135deg,#2563eb,#06b6d4)',
      svgIcon: (
        <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      ),
      action: () => onSelect('website-redesigner'),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .shimmer { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation: shimmer 1.4s infinite; border-radius:10px; }
        .metric-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.1); }
        .feat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.12); }
        .scan-row:hover { background:#f8fafc; }
        .metric-card,.feat-card,.scan-row { transition: all 0.18s ease; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#fff7ed 0%,#fffbeb 40%,#f0f9ff 100%)', fontFamily: 'Inter,sans-serif' }}>

        {/* ── Header ── */}
        <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1.5px solid #fed7aa', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(135deg,#ea580c,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FlowFinder</span>
            {stats?.github?.connected && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '20px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                GitHub: @{stats.github.username}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{user?.email}</span>
            <button onClick={() => router.push('/settings')} style={{ padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>⚙ Settings</button>
            <button onClick={handleLogout} style={{ padding: '7px 14px', border: '1.5px solid #fed7aa', borderRadius: '9px', background: '#fff7ed', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#c2410c' }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Welcome ── */}
          <div className="fade-up" style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
              Welcome back, {user?.fullName?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Here's your accessibility & design quality at a glance.</p>
          </div>

          {/* ── Metric Cards ── */}
          {/* <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28, animationDelay: '0.05s' }}>
            {metrics.map((m, i) => (
              <div key={i} className="metric-card" style={{ background: '#ffffff', border: '1.5px solid #e8d5c4', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {loading ? (
                  <><div style={{ height: 28, width: '60%', marginBottom: 8, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6 }} /><div style={{ height: 14, width: '80%', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6 }} /></>
                ) : (
                  <>
                    <div style={{ fontSize: 24, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{m.label}</div>
                  </>
                )}
              </div>
            ))}
          </div> */}

          {/* ── Quick Actions — 3-column grid ── */}
          <div className="fade-up" style={{ marginBottom: 28, animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {features.map(f => (
                <div key={f.key} onClick={f.action}
                  style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px 18px', cursor: 'pointer', transition: 'all .18s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    {f.svgIcon}
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Left: Fix Sessions */}
            <div className="fade-up" style={{ animationDelay: '0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Fix Sessions</h2>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ height: 64, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 12 }} />
                  ))}
                </div>
              ) : recentFixes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#ffffff', border: '1.5px dashed #e2e8f0', borderRadius: 14 }}>
                  <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>No fix sessions yet</p>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Fix accessibility or design issues to create a session</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentFixes.map(fix => {
                    const badge = statusBadge[fix.status] || { bg: '#f1f5f9', color: '#475569', label: fix.status };
                    return (
                      <div key={fix._id} style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fix.repoFullName}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{fix.totalFilesChanged} files · {fix.totalFixesApplied} fixes · {new Date(fix.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                        {fix.prUrl && (
                          <a href={fix.prUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}>#{fix.prNumber} ↗</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* GitHub CTA — only shown after load */}
              {!loading && !stats?.github?.connected && (
                <div style={{ marginTop: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#fff', fontSize: 13 }}>Connect GitHub</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Enable AI fix and PR workflow</p>
                  </div>
                  <button onClick={() => router.push('/settings')} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    Connect
                  </button>
                </div>
              )}
            </div>

            {/* Right: Recent Scans */}
            <div className="fade-up" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Scans</h2>
                <button onClick={() => router.push('/dashboard/accessibility')} style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all</button>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 72, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 12 }} />)}
                </div>
              ) : recentScans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', border: '1.5px dashed #e2e8f0', borderRadius: 14 }}>
                  <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>No scans yet</p>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Run the Chrome extension on any site</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentScans.map(scan => (
                    <div key={scan._id} onClick={() => router.push('/dashboard/accessibility')}
                      style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2.5px solid ${scoreColor(scan.scores?.accessibility)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(scan.scores?.accessibility) }}>{scan.scores?.accessibility ?? '?'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.websiteUrl}</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: scan.totalErrors > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                            {scan.totalErrors > 0 ? `${scan.totalErrors} issues` : 'Clean'}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(scan.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </>
  );
}