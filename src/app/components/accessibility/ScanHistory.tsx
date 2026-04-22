'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Scan {
  _id: string;
  websiteUrl: string;
  scanType: string;
  source: string;
  totalErrors: number;
  scores: { accessibility?: number; performance?: number; seo?: number; bestPractices?: number };
  status: string;
  createdAt: string;
}

interface ScanHistoryProps {
  onSelectScan: (scanId: string) => void;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}

const impactColor = (score?: number) => {
  if (!score && score !== 0) return '#94a3b8';
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
};

export default function ScanHistory({ onSelectScan, githubConnected, onConnectGitHub }: ScanHistoryProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState('');

  const fetchScans = async (url?: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/api/scans${url ? `?url=${encodeURIComponent(url)}` : ''}`;
      const data = await api.get<any>(endpoint);
      setScans(data.scans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchScans(searchUrl); };

  const deleteScan = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this scan?')) return;
    try {
      await api.delete(`/api/scans/${scanId}`);
      setScans(s => s.filter(sc => sc._id !== scanId));
    } catch { }
  };

  return (
    <div >
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Accessibility Scans</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Scans from your Chrome extension automatically appear here.
            </p>
          </div>
          {!githubConnected && (
            <button onClick={onConnectGitHub} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg,#1e293b,#334155)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: '#fff', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Connect GitHub to fix issues
            </button>
          )}
        </div>
      </div>

      {/* Info banner if no GitHub */}
      {!githubConnected && (
        <div style={{ marginBottom: '20px', padding: '16px 20px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #bfdbfe', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '24px' }}>💡</div>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#1e40af', fontSize: '14px' }}>Connect GitHub to unlock fix & PR workflow</p>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: '13px' }}>Select a scan → choose your repo → AI maps errors to source files → review diffs → raise a PR in one click.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text" value={searchUrl} onChange={e => setSearchUrl(e.target.value)}
          placeholder="Filter by URL..."
          style={{ flex: 1, padding: '10px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '14px', color: '#0f172a', fontFamily: 'Inter,sans-serif' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '14px' }}>Search</button>
        {searchUrl && <button type="button" onClick={() => { setSearchUrl(''); fetchScans(); }} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Clear</button>}
      </form>

      {/* States */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '100px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '14px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '14px', color: '#b91c1c', fontSize: '14px', textAlign: 'center' }}>
          {error} — <button onClick={() => fetchScans()} style={{ color: '#ea580c', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && scans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No scans yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
            Run the <strong>Flow Finder Chrome Extension</strong> on any website and your scan results will appear here automatically.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', fontSize: '13px', color: '#c2410c', fontWeight: 600 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Install the Chrome extension from the repo
          </div>
        </div>
      )}

      {/* Scan List */}
      {!loading && !error && scans.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scans.map(scan => (
            <div
              key={scan._id}
              onClick={() => onSelectScan(scan._id)}
              style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '18px', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ea580c'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(234,88,12,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
            >
              {/* Score circle */}
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f8fafc', border: `3px solid ${impactColor(scan.scores?.accessibility)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: impactColor(scan.scores?.accessibility) }}>
                  {scan.scores?.accessibility ?? '?'}
                </span>
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.websiteUrl}</p>
                  <span style={{ flexShrink: 0, padding: '2px 8px', background: scan.source === 'extension' ? '#eff6ff' : '#f0fdf4', color: scan.source === 'extension' ? '#3b82f6' : '#22c55e', fontSize: '11px', fontWeight: 700, borderRadius: '20px', textTransform: 'uppercase' }}>
                    {scan.source}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ fontSize: '12px', color: scan.totalErrors > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    {scan.totalErrors > 0 ? `${scan.totalErrors} issues found` : '✓ No issues'}
                  </span>
                </div>
              </div>

              {/* Score pills */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {(['performance', 'seo', 'bestPractices'] as const).map(key => (
                  scan.scores?.[key] != null && (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: impactColor(scan.scores[key]) }}>{scan.scores[key]}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'capitalize' }}>{key === 'bestPractices' ? 'BP' : key.slice(0, 4)}</div>
                    </div>
                  )
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={e => deleteScan(scan._id, e)}
                  style={{ width: '32px', height: '32px', border: 'none', background: '#fef2f2', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                  title="Delete scan"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div style={{ color: '#94a3b8' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
