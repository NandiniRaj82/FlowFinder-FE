'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DiffViewer from './DiffViewer';

interface ScanDetailsProps {
  scanId: string;
  githubConnected: boolean;
  githubUsername: string;
  onConnectGitHub: () => void;
}

interface Repo { fullName: string; name: string; language: string; defaultBranch: string; updatedAt: string; }
interface FixResult { sessionId: string; mappedFiles: any[]; unmappedErrors: any[]; totalErrors: number; fixedErrors: number; filesChanged: number; framework: string; }
interface FixHistoryItem {
  _id: string;
  status: string;
  repoFullName: string;
  totalFilesChanged: number;
  totalFixesApplied: number;
  prUrl?: string;
  prNumber?: number;
  branchName?: string;
  createdAt: string;
  framework?: string;
}

const impactBadge: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#fef2f2', color: '#b91c1c' },
  serious:  { bg: '#fff7ed', color: '#c2410c' },
  moderate: { bg: '#fefce8', color: '#a16207' },
  minor:    { bg: '#f0fdf4', color: '#15803d' },
};

export default function ScanDetails({ scanId, githubConnected, githubUsername, onConnectGitHub }: ScanDetailsProps) {
  const [scan, setScan] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(true);

  // Repo selector
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Fix generation
  const [generatingFixes, setGeneratingFixes] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [fixProgress, setFixProgress] = useState<{ stage: number; label: string; sub: string } | null>(null);

  // Fix history
  const [fixHistory, setFixHistory] = useState<FixHistoryItem[]>([]);

  // View
  const [view, setView] = useState<'errors' | 'diff'>('errors');

  useEffect(() => {
    api.get<any>(`/api/scans/${scanId}`)
      .then(d => { setScan(d.scan); setLoadingScan(false); })
      .catch(() => setLoadingScan(false));
  }, [scanId]);

  // Load fix history for this scan
  useEffect(() => {
    api.get<any>(`/api/fixes/by-scan/${scanId}`)
      .then(d => setFixHistory(d.sessions || []))
      .catch(() => {});
  }, [scanId]);

  useEffect(() => {
    if (!githubConnected) return;
    setLoadingRepos(true);
    api.get<any>('/api/github/repos')
      .then(d => { setRepos(d.repos || []); setLoadingRepos(false); })
      .catch(() => setLoadingRepos(false));
  }, [githubConnected]);

  const filteredRepos = repos.filter(r =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
    r.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const FIX_STAGES = [
    { label: 'Fetching repository file tree',   sub: 'Reading your repo structure from GitHub' },
    { label: 'Mapping errors to source files',  sub: 'AI is locating each issue in your code' },
    { label: 'Generating fixes with AI',        sub: 'Creating exact code patches for each file' },
    { label: 'Preparing diff view',             sub: 'Formatting changes for review' },
  ];

  const handleGenerateFixes = async (forceRefresh = false) => {
    if (!selectedRepo) return;
    setGeneratingFixes(true);
    setFixError(null);
    setFixResult(null);
    setIsCached(false);

    // Simulate progress stages while waiting for the API
    const stageDurations = [3000, 8000, 12000];
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    FIX_STAGES.forEach((s, i) => {
      const t = setTimeout(() => setFixProgress({ stage: i, label: s.label, sub: s.sub }), elapsed);
      timers.push(t);
      elapsed += stageDurations[i] ?? 0;
    });
    setFixProgress({ stage: 0, label: FIX_STAGES[0].label, sub: FIX_STAGES[0].sub });

    try {
      const result = await api.post<any>('/api/fixes/generate', {
        scanId,
        repoFullName: selectedRepo,
        forceRefresh,
      });
      timers.forEach(clearTimeout);
      setFixProgress({ stage: 3, label: FIX_STAGES[3].label, sub: FIX_STAGES[3].sub });
      await new Promise(r => setTimeout(r, 400));
      setFixResult(result);
      setIsCached(!!result.cached);
      setView('diff');
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setFixError(err.message);
    } finally {
      setGeneratingFixes(false);
      setFixProgress(null);
    }
  };

  if (loadingScan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '80px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '14px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
        ))}
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  if (!scan) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Scan not found.</div>;

  // ── DIFF VIEW ──────────────────────────────────────────────────────────────
  if (view === 'diff' && fixResult) {
    return (
      <>
        {isCached && (
          <div style={{ marginBottom: '12px', padding: '10px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>⚡ Showing cached results — no LLM calls made</span>
            <button
              onClick={() => { setView('errors'); setTimeout(() => handleGenerateFixes(true), 100); }}
              style={{ fontSize: '12px', padding: '4px 10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', color: '#166534', fontWeight: 600 }}
            >
              🔄 Re-run fresh
            </button>
          </div>
        )}
        <DiffViewer
          sessionId={fixResult.sessionId}
          mappedFiles={fixResult.mappedFiles}
          unmappedErrors={fixResult.unmappedErrors}
          repoFullName={selectedRepo}
          onBack={() => setView('errors')}
        />
      </>
    );
  }

  // ── ERROR LIST + REPO SELECTOR ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

      {/* Left — errors */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Scan meta */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.websiteUrl}</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                {new Date(scan.createdAt).toLocaleString()} · {scan.source} · {scan.scanType}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              {(['accessibility', 'performance', 'seo', 'bestPractices'] as const).map(k => (
                scan.scores?.[k] != null && (
                  <div key={k} style={{ textAlign: 'center', minWidth: '40px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: scan.scores[k] >= 90 ? '#22c55e' : scan.scores[k] >= 70 ? '#f59e0b' : '#ef4444' }}>
                      {scan.scores[k]}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'capitalize' }}>
                      {k === 'bestPractices' ? 'BP' : k === 'accessibility' ? 'A11y' : k.slice(0, 4)}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Error list */}
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {scan.errors?.length || 0} Issues Found
          </h3>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
            {['critical', 'serious', 'moderate', 'minor'].map(imp => {
              const count = scan.errors?.filter((e: any) => e.impact === imp).length;
              if (!count) return null;
              const style = impactBadge[imp] || { bg: '#f1f5f9', color: '#64748b' };
              return (
                <span key={imp} style={{ padding: '3px 10px', background: style.bg, color: style.color, borderRadius: '20px', fontWeight: 700, textTransform: 'capitalize' }}>
                  {count} {imp}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(!scan.errors || scan.errors.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <p style={{ color: '#15803d', fontWeight: 700, margin: 0 }}>No accessibility issues found!</p>
            </div>
          ) : scan.errors.map((err: any, i: number) => {
            const badge = impactBadge[err.impact] || { bg: '#f1f5f9', color: '#64748b' };
            return (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: err.message ? '8px' : 0 }}>
                  {err.impact && (
                    <span style={{ padding: '2px 10px', background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 700, borderRadius: '20px', textTransform: 'capitalize', flexShrink: 0 }}>
                      {err.impact}
                    </span>
                  )}
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{err.title || err.type}</p>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{err.source}</span>
                </div>
                {err.message && <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{err.message}</p>}
                {err.selector && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {err.selector}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — Fix panel */}
      <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '88px' }}>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#ea580c,#f59e0b)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '14px' }}>Fix in Code</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>AI-powered source fix + PR</p>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {!githubConnected ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔗</div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                  Connect your GitHub account to map these errors to source files and raise a fix PR.
                </p>
                <button onClick={onConnectGitHub} style={{ width: '100%', padding: '11px', background: '#1e293b', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                  Connect GitHub →
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Select repository</p>

                {/* Repo selector */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <button
                    onClick={() => setShowRepoDropdown(s => !s)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: selectedRepo ? '#0f172a' : '#94a3b8', fontWeight: selectedRepo ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedRepo || 'Choose a repo...'}</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  {showRepoDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: '260px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px' }}>
                        <input
                          autoFocus
                          value={repoSearch}
                          onChange={e => setRepoSearch(e.target.value)}
                          placeholder="Search repos..."
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loadingRepos ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Loading repos...</div>
                        ) : filteredRepos.map(repo => (
                          <button
                            key={repo.fullName}
                            onClick={() => { setSelectedRepo(repo.fullName); setShowRepoDropdown(false); setRepoSearch(''); }}
                            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <svg width="14" height="14" fill="#94a3b8" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.name}</p>
                              {repo.language && <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{repo.language}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fix error */}
                {fixError && (
                  <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', color: '#b91c1c' }}>
                    {fixError}
                  </div>
                )}

                {/* Steps */}
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { n: '1', label: 'Select repository', done: !!selectedRepo },
                    { n: '2', label: 'AI maps errors to source files', done: !!fixResult },
                    { n: '3', label: 'Review diffs & raise PR', done: false },
                  ].map(step => (
                    <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: step.done ? '#22c55e' : '#f1f5f9', border: `2px solid ${step.done ? '#22c55e' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {step.done
                          ? <svg width="11" height="11" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          : <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{step.n}</span>}
                      </div>
                      <span style={{ fontSize: '12px', color: step.done ? '#22c55e' : '#475569', fontWeight: step.done ? 700 : 400 }}>{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress indicator */}
                {generatingFixes && fixProgress && (
                  <div style={{ marginBottom: 16, background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '16px 18px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Generating fixes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {FIX_STAGES.map((s, i) => {
                        const isDone = i < fixProgress.stage;
                        const isActive = i === fixProgress.stage;
                        return (
                          <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? '#22c55e' : isActive ? '#7c3aed' : '#e2e8f0', border: `2px solid ${isDone ? '#22c55e' : isActive ? '#7c3aed' : '#e2e8f0'}`, boxShadow: isActive ? '0 0 8px rgba(124,58,237,0.4)' : 'none', transition: 'all .3s' }}>
                                {isDone
                                  ? <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                  : isActive
                                    ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block', animation: 'pulse 1s infinite' }} />
                                    : <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{i + 1}</span>}
                              </div>
                              {i < FIX_STAGES.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: isDone ? '#22c55e' : '#e2e8f0', margin: '2px 0', transition: 'background .3s' }} />}
                            </div>
                            <div style={{ paddingLeft: 10, paddingBottom: i < FIX_STAGES.length - 1 ? 14 : 0, paddingTop: 2, flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isDone ? '#22c55e' : isActive ? '#7c3aed' : '#94a3b8', transition: 'color .3s' }}>{s.label}</p>
                              {isActive && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748b' }}>{s.sub}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 12, height: 3, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#ea580c)', width: `${Math.round((fixProgress.stage / (FIX_STAGES.length - 1)) * 100)}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateFixes(false)}
                  disabled={!selectedRepo || generatingFixes || scan.errors?.length === 0}
                  style={{ width: '100%', padding: '12px', background: !selectedRepo || generatingFixes ? '#e2e8f0' : 'linear-gradient(135deg,#ea580c,#f59e0b)', border: 'none', borderRadius: '10px', cursor: !selectedRepo || generatingFixes ? 'not-allowed' : 'pointer', color: !selectedRepo || generatingFixes ? '#94a3b8' : '#fff', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s', fontFamily: 'inherit' }}
                >
                  {generatingFixes ? 'Analyzing & generating fixes…' : 'Generate Fixes'}
                </button>

              </>
            )}
          </div>
        </div>

        {/* ── Fix History ── */}
        {fixHistory.length > 0 && (
          <div style={{ marginTop: '16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>Fix History</p>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fixHistory.length} session{fixHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fixHistory.map(session => {
                const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
                  pr_created:  { bg: '#f0fdf4', color: '#15803d', label: 'PR Created' },
                  review:      { bg: '#fef9c3', color: '#a16207', label: 'In Review' },
                  error:       { bg: '#fef2f2', color: '#b91c1c', label: 'Error' },
                  creating_pr: { bg: '#eff6ff', color: '#1d4ed8', label: 'Creating…' },
                  generating:  { bg: '#faf5ff', color: '#7e22ce', label: 'Generating' },
                };
                const badge = statusStyles[session.status] || { bg: '#f1f5f9', color: '#64748b', label: session.status };
                return (
                  <div key={session._id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: badge.bg, color: badge.color }}>{badge.label}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.repoFullName}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{session.totalFilesChanged} file{session.totalFilesChanged !== 1 ? 's' : ''} · {session.totalFixesApplied} fix{session.totalFixesApplied !== 1 ? 'es' : ''}</p>
                    {session.prUrl && (
                      <a href={session.prUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: 700, color: '#7c3aed', textDecoration: 'none' }}>
                        View PR #{session.prNumber} ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
