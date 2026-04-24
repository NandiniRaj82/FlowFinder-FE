'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface FullHistoryEntry {
  _id: string;
  websiteUrl: string;
  styleName: string;
  style: string;
  framework: string;
  frameworkLabel: string;
  isSaved: boolean;
  prCreated?: boolean;
  createdAt: string;
  previewHtml?: string;
}

interface HistoryEntry extends Omit<FullHistoryEntry, 'previewHtml'> {}

interface Props {
  onViewDesign: (entry: FullHistoryEntry) => void;
  onNewRedesign: () => void;
}

/* ── SVG Icons ── */
function HistoryIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
}
function OpenIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
}
function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin .7s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeWidth={2} strokeOpacity={0.25}/>
      <path d="M12 2a10 10 0 0110 10" strokeWidth={2.5} strokeLinecap="round"/>
    </svg>
  );
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const hostnameOf = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };

const fwColor = (fw: string) => ({ html: '#e34c26', react: '#61dafb', nextjs: '#a3a3a3', vue: '#42b883', angular: '#dd0031' } as any)[fw] ?? '#6366f1';

export default function RedesignHistory({ onViewDesign, onNewRedesign }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/api/redesign/history')
      .then(d => setEntries(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this design from history?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/redesign/${id}`);
      setEntries(prev => prev.filter(x => x._id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  // Fetch full entry (with previewHtml) then hand off to dashboard to display in results view
  const handleOpen = async (entry: HistoryEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openingId === entry._id) return;
    setOpeningId(entry._id);
    try {
      const data = await api.get<any>(`/api/redesign/${entry._id}`);
      const fullEntry: FullHistoryEntry = data?.entry || entry;
      onViewDesign(fullEntry);
    } catch {
      alert('Failed to load design.');
    } finally {
      setOpeningId(null);
    }
  };

  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 12,
    height: 68,
  };

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6366f1' }}><HistoryIcon /></span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Design History</h3>
          {!loading && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 99 }}>
              {entries.length}
            </span>
          )}
        </div>
        <button
          onClick={onNewRedesign}
          style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
        >
          + New Redesign
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={shimmerStyle} />)}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>No redesigns yet</p>
          <p style={{ fontSize: 12 }}>Generate a redesign to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(entry => (
            <div
              key={entry._id}
              onClick={() => handleOpen(entry)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                padding: '14px 16px',
                cursor: openingId === entry._id ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'box-shadow .15s ease, border-color .15s ease',
                opacity: openingId === entry._id ? 0.65 : 1,
              }}
              onMouseEnter={e => { if (openingId !== entry._id) { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,.12)'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'; }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {hostnameOf(entry.websiteUrl)}
                  </p>
                  {/* Style badge */}
                  {entry.styleName && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#7c3aed', flexShrink: 0 }}>
                      {entry.styleName}
                    </span>
                  )}
                  {/* Framework badge */}
                  {entry.framework && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${fwColor(entry.framework)}18`, color: fwColor(entry.framework), flexShrink: 0 }}>
                      {entry.frameworkLabel || entry.framework}
                    </span>
                  )}
                  {/* PR badge */}
                  {entry.prCreated && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#dcfce7', color: '#15803d', flexShrink: 0 }}>
                      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      PR
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  {formatDate(entry.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={e => handleOpen(entry, e)}
                  disabled={!!openingId}
                  style={{ background: 'none', border: 'none', cursor: openingId === entry._id ? 'wait' : 'pointer', color: '#6366f1', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 7, transition: 'background .15s' }}
                  title="View this design"
                  onMouseEnter={e => (e.currentTarget.style.background = '#ede9fe')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {openingId === entry._id ? <SpinnerIcon /> : <OpenIcon />}
                </button>
                <button
                  onClick={e => handleDelete(entry._id, e)}
                  disabled={!!deletingId || !!openingId}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 7, opacity: .6, transition: 'background .15s, opacity .15s' }}
                  title="Delete"
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.opacity = '.6'; }}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
