'use client';

import React, { useState } from 'react';
import CodeViewer from './CodeViewer';
import { api } from '@/lib/api';
import type { DesignHistoryEntry } from './dashboard';

interface Stats { headings: number; paragraphs: number; listItems: number; tags: number; sections: number; }

interface Props {
  designHistory: DesignHistoryEntry[];
  activeDesignId: string | null;
  websiteUrl: string;
  pageTitle: string;
  screenshotBase64?: string;
  stats?: Stats;
  onReset: () => void;
  isStreaming?: boolean;
  pendingStyles?: string[];
  onSelectDesign: (id: string) => void;
  onToggleSave: (id: string) => void;
  githubConnected?: boolean;
  onConnectGitHub?: () => void;
}

function getExt(fw: string) { return fw === 'react' || fw === 'nextjs' ? 'jsx' : fw === 'vue' ? 'vue' : fw === 'angular' ? 'ts' : 'html'; }
function fwLabel(fw: string) { return ({ html: 'HTML', react: 'React', nextjs: 'Next.js', vue: 'Vue 3', angular: 'Angular' } as any)[fw] ?? fw; }
function fwColor(fw: string) { return ({ html: '#e34c26', react: '#61dafb', nextjs: '#a3a3a3', vue: '#42b883', angular: '#dd0031' } as any)[fw] ?? '#6366f1'; }

function defaultFilePath(fw: string) {
  if (fw === 'react') return 'src/App.jsx';
  if (fw === 'nextjs') return 'pages/index.jsx';
  if (fw === 'vue') return 'src/App.vue';
  if (fw === 'angular') return 'src/app/app.component.ts';
  return 'index.html';
}

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff' }}>
    <div style={{ height: 220, background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, border: '3px solid rgba(99,102,241,.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Generating…</p>
      </div>
    </div>
    <div style={{ padding: '10px 14px' }}>
      <div style={{ height: 12, width: '55%', background: '#e2e8f0', borderRadius: 6 }} />
      <div style={{ height: 10, width: '35%', background: '#f1f5f9', borderRadius: 6, marginTop: 6 }} />
    </div>
  </div>
);

/* ── Design card ── */
const DesignCard = ({ entry, onOpen, onSave }: { entry: DesignHistoryEntry; onOpen: () => void; onSave: (e: React.MouseEvent) => void }) => {
  const { design } = entry;
  const color = fwColor(design.framework);
  const code = design.code || design.previewHtml || '';
  return (
    <div
      style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,.06)', transition: 'transform .2s,box-shadow .2s', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,.14)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,.06)'; }}
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        <iframe srcDoc={design.previewHtml || code} style={{ position: 'absolute', top: 0, left: 0, width: 1400, height: 900, transform: 'scale(.245)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }} sandbox="allow-scripts allow-same-origin" title={design.styleName} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12, opacity: 0, transition: 'opacity .2s' }} className="card-overlay">
          <span style={{ background: 'rgba(15,23,42,.85)', color: '#fff', padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Click to expand ↗</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{design.styleName}</p>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${color}18`, color }}>{fwLabel(design.framework)}</span>
        </div>
        <button onClick={onSave} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: entry.isSaved ? '#fbbf24' : '#cbd5e1', transition: 'color .15s,transform .1s', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.3)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
          title={entry.isSaved ? 'Unsave' : 'Save'}
        ><svg width="14" height="14" fill={entry.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
      </div>
    </div>
  );
};

/* ── GitHub Apply Panel ── */
const GitHubPanel = ({ entry, githubConnected, onConnectGitHub }: { entry: DesignHistoryEntry; githubConnected: boolean; onConnectGitHub: () => void }) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branch, setBranch] = useState(`flowfinder/redesign-${entry.design.style}`);
  const [applying, setApplying] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [error, setError] = useState('');

  const loadRepos = async () => {
    setLoadingRepos(true);
    try { const d = await api.get<any>('/api/github/repos'); setRepos(d.repos || []); } catch { setError('Failed to load repos'); }
    finally { setLoadingRepos(false); }
  };

  const handleApply = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split('/');
    setApplying(true); setError(''); setPrUrl('');
    try {
      const code = entry.design.code || entry.design.previewHtml || '';
      const filePath = defaultFilePath(entry.design.framework);

      const tryCreate = async (branchToUse: string) => {
        return await api.post<any>(`/api/github/repos/${owner}/${repo}/create-pr`, {
          branchName: branchToUse,
          baseBranch: 'main',
          prTitle: `FlowFinder Redesign: ${entry.design.styleName}`,
          prBody: `AI-generated redesign using the **${entry.design.styleName}** style.\n\nGenerated by [FlowFinder](https://flowfinder.app).`,
          files: [{ path: filePath, content: code }],
        });
      };

      try {
        const d = await tryCreate(branch);
        setPrUrl(d.pr?.url || '');
      } catch (firstErr: any) {
        // If branch already exists, retry with a random suffix
        if (firstErr.message?.toLowerCase().includes('reference already exists') || firstErr.message?.toLowerCase().includes('already exists')) {
          const suffix = Math.random().toString(36).slice(2, 6);
          const newBranch = `${branch}-${suffix}`;
          setBranch(newBranch);
          const d = await tryCreate(newBranch);
          setPrUrl(d.pr?.url || '');
        } else {
          throw firstErr;
        }
      }
    } catch (e: any) { setError(e.message || 'Failed to create PR'); }
    finally { setApplying(false); }
  };

  if (!githubConnected) return (
    <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
      <div>
        <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#fff', fontSize: 14 }}>Apply to GitHub Repo</p>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Connect GitHub to push this design as a pull request</p>
      </div>
      <button onClick={onConnectGitHub} style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>Connect GitHub</button>
    </div>
  );

  return (
    <div style={{ marginTop: 12, padding: '16px 20px', background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1e293b' }}><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>Apply to GitHub</span>
        </div>
        {repos.length === 0 && !prUrl && <button onClick={loadRepos} disabled={loadingRepos} style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'none', border: '1.5px solid #e0e7ff', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{loadingRepos ? 'Loading…' : 'Load Repos'}</button>}
      </div>

      {/* ── Success state: PR was created ── */}
      {prUrl ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
            <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          </div>
          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Pull Request Created</p>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>Your redesign has been pushed to GitHub</p>
          <a href={prUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: 'linear-gradient(135deg,#1e293b,#334155)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
            <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            View on GitHub
          </a>
        </div>
      ) : repos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#1e293b', fontFamily: 'inherit' }}>
            <option value="">Select a repository…</option>
            {repos.map((r: any) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
          </select>
          <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="Branch name" style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#1e293b', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button onClick={handleApply} disabled={!selectedRepo || applying} style={{ padding: '9px 0', background: selectedRepo && !applying ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0', border: 'none', borderRadius: 9, cursor: selectedRepo && !applying ? 'pointer' : 'not-allowed', color: selectedRepo && !applying ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all .15s' }}>
            {applying ? 'Creating PR…' : <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle',marginRight:4}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>Create Pull Request</>}
          </button>
          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>{error}</p>}
        </div>
      ) : null}
    </div>
  );
};

/* ── Full-screen modal ── */
const DesignModal = ({ entry, onClose, onSave, githubConnected, onConnectGitHub }: { entry: DesignHistoryEntry; onClose: () => void; onSave: () => void; githubConnected: boolean; onConnectGitHub: () => void }) => {
  const { design } = entry;
  const [tab, setTab] = useState<'preview' | 'code' | 'github'>('preview');
  const code = design.code || design.previewHtml || '';
  const ext = getExt(design.framework);
  const color = fwColor(design.framework);

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `design-${design.style}.${ext}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{design.styleName}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {fwLabel(design.framework)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tabs */}
          {(['preview', 'code', 'github'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: tab === t ? 'rgba(99,102,241,.25)' : 'transparent', color: tab === t ? '#a5b4fc' : '#64748b', transition: 'all .15s' }}>
              {t === 'preview' ? <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle',marginRight:3}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Preview</> : t === 'code' ? '{ } Code' : <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle',marginRight:3}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>GitHub</>}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.1)', margin: '0 4px' }} />
          {/* Save */}
          <button onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: entry.isSaved ? 'rgba(251,191,36,.12)' : 'rgba(255,255,255,.06)', border: `1px solid ${entry.isSaved ? 'rgba(251,191,36,.4)' : 'rgba(255,255,255,.12)'}`, color: entry.isSaved ? '#fbbf24' : '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span><svg width="12" height="12" fill={entry.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>{entry.isSaved ? 'Saved' : 'Save'}
          </button>
          {/* Download */}
          <button onClick={download} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            .{ext}
          </button>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'preview' && <iframe srcDoc={design.previewHtml || code} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} sandbox="allow-scripts allow-same-origin" title={design.styleName} />}
        {tab === 'code' && <CodeViewer code={code} framework={design.framework} filename={`design-${design.style}.${ext}`} height="100%" />}
        {tab === 'github' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '24px', maxWidth: 600, margin: '0 auto' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>Apply Design to GitHub Repo</h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>This will create a pull request on your selected repository with the {design.styleName} design applied.</p>
            <GitHubPanel entry={entry} githubConnected={githubConnected} onConnectGitHub={onConnectGitHub} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main component ── */
const WebsiteRedesignerResults: React.FC<Props> = ({
  designHistory, activeDesignId, websiteUrl, pageTitle, screenshotBase64,
  onReset, isStreaming, pendingStyles = [], onSelectDesign, onToggleSave,
  githubConnected = false, onConnectGitHub = () => {},
}) => {
  const [modalId, setModalId] = useState<string | null>(null);

  const hostname = (() => { try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; } })();
  const modalEntry = designHistory.find(e => e.id === modalId) ?? null;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .card-overlay:hover{opacity:1!important}
      `}</style>

      {modalEntry && (
        <DesignModal
          entry={modalEntry}
          onClose={() => setModalId(null)}
          onSave={() => onToggleSave(modalEntry.id)}
          githubConnected={githubConnected}
          onConnectGitHub={onConnectGitHub}
        />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {screenshotBase64 && <img src={`data:image/jpeg;base64,${screenshotBase64}`} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e2e8f0' }} alt="screenshot" />}
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{hostname}</p>
              <h2 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{pageTitle || hostname}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                {isStreaming ? `${designHistory.length} ready · ${pendingStyles.length} generating…` : `${designHistory.length} design${designHistory.length !== 1 ? 's' : ''} generated`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> New Redesign</button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 24 }}>
          {designHistory.map((entry, i) => (
            <div key={entry.id} style={{ animation: `slideUp .4s ${i * .06}s both` }}>
              <DesignCard
                entry={entry}
                onOpen={() => { setModalId(entry.id); onSelectDesign(entry.id); }}
                onSave={e => { e.stopPropagation(); onToggleSave(entry.id); }}
              />
            </div>
          ))}
          {pendingStyles.map(s => <SkeletonCard key={s} />)}
        </div>
      </div>
    </>
  );
};

export default WebsiteRedesignerResults;