'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DesignScanItem {
  _id: string;
  websiteUrl: string;
  figmaUrl: string;
  matchScore: number;
  verdict: string;
  totalIssues: number;
  createdAt: string;
}

interface Props {
  onLoadScan: (scanId: string) => void;
  onNewScan: () => void;
}

function HistoryIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
}
function ExternalIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>;
}

const verdictColor = (v: string) => {
  if (v === 'excellent') return { color: 'var(--success)',  bg: 'var(--success-bg)' };
  if (v === 'good')      return { color: '#3b82f6',         bg: '#eff6ff' };
  if (v === 'partial')   return { color: 'var(--warning)',  bg: 'var(--warning-bg)' };
  if (v === 'divergent') return { color: '#f97316',         bg: '#fff7ed' };
  return                        { color: 'var(--error)',    bg: 'var(--error-bg)' };
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const hostname = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };

export default function DesignScanHistory({ onLoadScan, onNewScan }: Props) {
  const [scans, setScans] = useState<DesignScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/api/match-design/history')
      .then(d => setScans(d.scans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this scan?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/match-design/${id}`);
      setScans(s => s.filter(x => x._id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 10,
    height: 72,
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'box-shadow .15s ease, border-color .15s ease',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent)' }}><HistoryIcon /></span>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Scan History</h3>
          {!loading && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: 99 }}>
              {scans.length}
            </span>
          )}
        </div>
        <button onClick={onNewScan} style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
          + New Scan
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1,2,3].map(i => (
          <div key={i} style={shimmerStyle} />
        ))}
      </div>
      ) : scans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: .4 }}>
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>No scans yet</p>
          <p style={{ fontSize: 12 }}>Run your first design comparison to see history here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scans.map(scan => {
            const vc = verdictColor(scan.verdict || 'partial');
            return (
              <div
                key={scan._id}
                onClick={() => onLoadScan(scan._id)}
                style={cardStyle}
              >
                {/* Score ring */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: vc.bg, border: `2px solid ${vc.color}`,
                  fontSize: 13, fontWeight: 900, color: vc.color,
                }}>
                  {scan.matchScore}%
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hostname(scan.websiteUrl)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: vc.bg, color: vc.color }}>
                      {scan.verdict || 'partial'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scan.totalIssues} issues</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(scan.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ color: 'var(--accent)', opacity: .7 }}><ExternalIcon /></span>
                  <button
                    onClick={e => handleDelete(scan._id, e)}
                    disabled={deletingId === scan._id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', opacity: .6, padding: 4 }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
