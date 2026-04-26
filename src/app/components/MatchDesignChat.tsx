'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';


/* ─── Types ──────────────────────────────────────────────────────────────── */
interface BoundingBox { x: number; y: number; width: number; height: number; }
interface Mismatch {
  issueNumber: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  figmaValue: string;
  liveValue: string;
  boundingBox?: BoundingBox;
  property?: string;
  delta?: number;
  matchConfidence?: number;
}
interface Props {
  mismatches: Mismatch[];
  websiteUrl: string;
  figmaUrl: string;
  websiteScreenshot: string;
  figmaScreenshot: string;
  diffImageBase64?: string;
  matchScore: number;
  projectedScore: number;
  verdict?: string;
  verdictDetail?: string;
  sectionScores?: number[];
  worstSection?: { sectionIndex: number; matchPct: number; label: string } | null;
  layoutDivergence?: number;
  onReset: () => void;
}


/* ─── Severity config ────────────────────────────────────────────────────── */
const SEV: Record<string, { bg: string; text: string; hex: string; label: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', label: 'Critical' },
  major: { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316', label: 'Major' },
  minor: { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', label: 'Minor' },
};
const getSev = (s: string) => SEV[(s || 'minor').toLowerCase()] ?? SEV.minor;

/* ─── Score helpers ──────────────────────────────────────────────────────── */
function scoreMeta(score: number) {
  if (score >= 80) return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-300', stroke: '#22c55e', label: 'Great' };
  if (score >= 50) return { cls: 'bg-orange-100  text-orange-700  border-orange-300', stroke: '#f97316', label: 'Needs Work' };
  return { cls: 'bg-red-100     text-red-700     border-red-300', stroke: '#ef4444', label: 'Poor' };
}

/* ─── Animated ring ──────────────────────────────────────────────────────── */
function ScoreRing({ score, label, sub }: { score: number; label: string; sub: string }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 150); return () => clearTimeout(t); }, []);
  const R = 38; const C = 2 * Math.PI * R;
  const { stroke } = scoreMeta(score);
  const textCls = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-orange-500' : 'text-red-500';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" className="-rotate-90">
          <circle cx="44" cy="44" r={R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          <circle cx="44" cy="44" r={R} fill="none" stroke={stroke} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={go ? C * (1 - score / 100) : C}
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${textCls}`}>{score}%</span>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

/* ─── Bounding box overlays ──────────────────────────────────────────────── */
function BoxOverlays({ mismatches, activeIssue, onEnter, onLeave, onClick }: {
  mismatches: Mismatch[];
  activeIssue: number | null;
  onEnter: (n: number, title: string, cx: number, cy: number) => void;
  onLeave: () => void;
  onClick: (n: number) => void;
}) {
  return (
    <>
      {mismatches.map(m => {
        if (!m.boundingBox) return null;
        const b = m.boundingBox;
        const isActive = activeIssue === m.issueNumber;
        const cfg = getSev(m.severity);
        return (
          <div
            key={m.issueNumber}
            onClick={() => onClick(m.issueNumber)}
            onMouseEnter={e => onEnter(m.issueNumber, m.title, e.clientX, e.clientY)}
            onMouseLeave={onLeave}
            style={{
              position: 'absolute',
              left: `${b.x}%`, top: `${b.y}%`,
              width: `${b.width}%`, height: `${b.height}%`,
              border: `2px solid ${cfg.hex}`,
              backgroundColor: isActive ? `${cfg.hex}30` : 'rgba(239,68,68,0.12)',
              cursor: 'pointer',
              zIndex: isActive ? 20 : 10,
              transition: 'all 0.15s ease',
              boxShadow: isActive ? `0 0 0 3px ${cfg.hex}40` : 'none',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: 2,
              width: 16, height: 16, borderRadius: '50%',
              backgroundColor: cfg.hex, color: '#fff',
              fontSize: 8, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.issueNumber}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
const MatchDesignChat: React.FC<Props> = ({
  mismatches, websiteUrl, figmaUrl,
  websiteScreenshot, figmaScreenshot,
  diffImageBase64,
  matchScore, projectedScore,
  verdict = 'partial', verdictDetail,
  sectionScores = [], worstSection, layoutDivergence = 0,
  onReset,
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<'issues' | 'compare'>('issues');
  const [compareTab, setCompareTab] = useState<'side' | 'diff'>('side');
  const [activeIssue, setActive] = useState<number | null>(null);
  const [splitPct, setSplit] = useState(50);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);


  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [showMinor, setShowMinor] = useState(false);

  const critCount = mismatches.filter(m => m.severity === 'critical').length;
  const majCount  = mismatches.filter(m => m.severity === 'major').length;
  const minCount  = mismatches.filter(m => m.severity === 'minor').length;

  // Apply minor filter
  const visibleMismatches = showMinor
    ? mismatches
    : mismatches.filter(m => m.severity !== 'minor');

  const hostname = (() => { try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; } })();
  const sm = scoreMeta(matchScore);

  /* draggable divider */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSplit(Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const scrollToCard = useCallback((n: number) => {
    setActive(n);
    const idx = mismatches.findIndex(m => m.issueNumber === n);
    if (idx >= 0) cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [mismatches]);

  const handleBoxEnter = useCallback((n: number, title: string, cx: number, cy: number) => {
    setActive(n); setTooltip({ x: cx, y: cy, text: title });
  }, []);
  const handleBoxLeave = useCallback(() => { setActive(null); setTooltip(null); }, []);

  /* image src helpers — website=png (now), figma=png */
  const webSrc = websiteScreenshot ? `data:image/png;base64,${websiteScreenshot}` : '';
  const figmaSrc = figmaScreenshot ? `data:image/png;base64,${figmaScreenshot}` : '';
  const diffSrc = diffImageBase64 ? `data:image/png;base64,${diffImageBase64}` : '';

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes popIn   { 0%{opacity:0;transform:scale(0.6)} 70%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        .md-scroll::-webkit-scrollbar{width:5px}
        .md-scroll::-webkit-scrollbar-track{background:transparent}
        .md-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px}
        .divider:hover .divider-bar{background:#8b5cf6}
      `}</style>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-[999] bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl pointer-events-none max-w-[200px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}>
          {tooltip.text}
        </div>
      )}

      <div className="flex flex-col h-full min-h-0 bg-slate-50">

        {/* ── Sub-header ── */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-5 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode toggle */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(['issues', 'compare'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {m === 'issues'
                      ? <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Issues</>
                      : <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Compare</>}
                  </button>
                ))}
              </div>
              <span style={{ border: `1.5px solid ${matchScore >= 80 ? '#86efac' : matchScore >= 50 ? '#fdba74' : '#fca5a5'}`, color: matchScore >= 80 ? '#15803d' : matchScore >= 50 ? '#c2410c' : '#dc2626', background: matchScore >= 80 ? '#f0fdf4' : matchScore >= 50 ? '#fff7ed' : '#fef2f2', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: matchScore >= 80 ? '#22c55e' : matchScore >= 50 ? '#f97316' : '#ef4444', flexShrink: 0 }} />
                {matchScore}% match
              </span>
              <span className="text-xs text-slate-400">{critCount} critical · {majCount} major · {minCount} minor</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Minor toggle */}
              <button
                onClick={() => setShowMinor(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  showMinor
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                {showMinor ? `Minor (${minCount})` : `Show minor (${minCount})`}
              </button>
              <span className="text-xs text-slate-400 hidden md:flex items-center gap-1 truncate max-w-[200px]"><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>{hostname}</span>
              <button onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-400 shadow-sm transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Comparison
              </button>
            </div>
          </div>
        </div>


        {/* ══════════════════ ISSUES MODE ══════════════════ */}
        {mode === 'issues' && (
          <div className="flex-1 overflow-y-auto md-scroll">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-7">

              {/* Score card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden" style={{ animation: 'fadeIn .4s both' }}>
                <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
                <div className="px-8 py-7">
                  <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>Design Match Score</h2>
                  <p className="text-xs text-slate-400 mb-5">Hybrid spatial + pixel comparison — IoU element matching with property diffing</p>

                  {/* Verdict banner */}
                  {verdictDetail && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2.5 ${
                      verdict === 'excellent' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      verdict === 'good'      ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      verdict === 'partial'   ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                      verdict === 'divergent' ? 'bg-orange-50 text-orange-900 border border-orange-200' :
                                               'bg-red-50 text-red-900 border border-red-200'
                    }`}>
                      <span className="flex-shrink-0 mt-0.5">
                        {verdict === 'excellent' || verdict === 'good'
                          ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          : verdict === 'partial'
                          ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      </span>
                      <div>
                        <span className="font-bold capitalize">{verdict === 'unrelated' ? 'Completely Different Pages' : verdict === 'divergent' ? 'Structural Divergence Detected' : verdict}</span>
                        <p className="font-normal text-xs mt-0.5 opacity-80">{verdictDetail}</p>
                      </div>
                    </div>
                  )}

                  {/* Score rings */}
                  <div className="flex items-center justify-around gap-6 flex-wrap">
                    <ScoreRing score={matchScore} label="Current Match" sub="Before fixes" />
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-black shadow-md"
                        style={{ animation: 'popIn .6s .8s both' }}>
                        {projectedScore > matchScore ? `+${projectedScore - matchScore}% gain` : 'No CSS fix potential'}
                      </div>
                      {(verdict === 'divergent' || verdict === 'unrelated') && (
                        <p className="text-[10px] text-slate-400 text-center max-w-[120px]">Layout restructure needed — CSS alone won't fix this</p>
                      )}
                    </div>
                    <ScoreRing score={projectedScore} label={verdict === 'divergent' || verdict === 'unrelated' ? 'Max Achievable' : 'After All Fixes'} sub="Projected score" />
                  </div>

                  {/* Section Heatmap — INNOVATIVE: shows per-section match % as a vertical bar chart */}
                  {sectionScores.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Section-by-Section Breakdown</p>
                      <div className="flex gap-1 items-end h-16" title="Each bar = 10% of page height. Red = major diff, green = close match.">
                        {sectionScores.map((score, i) => {
                          const color = score >= 80 ? '#22c55e' : score >= 55 ? '#f59e0b' : score >= 30 ? '#f97316' : '#ef4444';
                          const heightPct = Math.max(8, 100 - score); // invert: taller = more different
                          const labels = ['Top','','','Upper','','Mid','','','Lower','Footer'];
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`Section ${i+1}: ${score}% match`}>
                              <span className="text-[8px] text-slate-400 font-bold">{score}%</span>
                              <div style={{ width: '100%', height: `${heightPct}%`, background: color, borderRadius: '3px 3px 0 0', minHeight: 4, transition: 'height .6s ease' }} />
                              <span className="text-[8px] text-slate-300 truncate w-full text-center">{labels[i]}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Taller bar = bigger difference. Hover for exact scores.</p>

                      {/* Worst section callout */}
                      {worstSection && worstSection.matchPct < 80 && (
                        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                          <svg width="13" height="13" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <p className="text-xs text-red-700 font-medium">Biggest divergence: <strong>{worstSection.label}</strong> — only <strong>{worstSection.matchPct}%</strong> match</p>
                        </div>
                      )}

                      {/* Layout divergence badge */}
                      {layoutDivergence > 15 && (
                        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                          <svg width="13" height="13" fill="none" stroke="#b45309" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                          <p className="text-xs text-amber-800 font-medium">Page height difference: <strong>{layoutDivergence}%</strong> — the {layoutDivergence > 50 ? 'pages are very different lengths, bottom sections were padded for comparison' : 'design and live site have different lengths'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Issues by severity</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Critical', count: critCount, color: 'bg-red-500', note: 'Color / major visual diff' },
                        { label: 'Major', count: majCount, color: 'bg-orange-500', note: 'Layout / font / content' },
                        { label: 'Minor', count: minCount, color: 'bg-yellow-400', note: 'Spacing / radius / weight' },
                      ].map(({ label, count, color, note }) => (
                        <div key={label} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-xs font-bold text-slate-700">{count} {label}</span>
                          <span className="text-[10px] text-slate-400">{note}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">
                      Score = pixel similarity % · fix all issues to reach 100%
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues list */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden" style={{ animation: 'fadeIn .5s .1s both' }}>
                <div className="h-1.5 bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500" />
                <div className="px-6 py-6">
                  <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Issues
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{visibleMismatches.length}</span>
                    {!showMinor && minCount > 0 && (
                      <span className="text-xs text-slate-400 font-normal">({minCount} minor hidden)</span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">Switch to Compare view to see issues highlighted on screenshots</p>
                  <div className="space-y-3">
                    {visibleMismatches.map((m, i) => {
                      const cfg = getSev(m.severity);
                      return (
                        <div key={m.issueNumber} ref={el => { cardRefs.current[i] = el; }}
                          className="rounded-2xl border-2 border-slate-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                          style={{ animation: `slideUp .35s ease-out ${i * .05}s both` }}>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-lg text-white text-[11px] font-black flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: cfg.hex }}>{m.issueNumber}</span>
                                <h3 className="font-bold text-slate-800 text-sm leading-tight">{m.title}</h3>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-violet-100 text-violet-700">{m.category}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1"><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{m.location}{m.matchConfidence != null && <span className="ml-2 text-violet-500">({m.matchConfidence}% match confidence)</span>}</p>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{m.description}{m.property && <span className="ml-1 text-slate-400">({m.property})</span>}</p>
                            {m.figmaValue && m.figmaValue !== 'N/A' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-bold text-emerald-700 mb-0.5 uppercase tracking-wide">Figma</p>
                                  <p className="text-[11px] text-emerald-800 font-mono break-all">{m.figmaValue}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-bold text-red-700 mb-0.5 uppercase tracking-wide">Live Site</p>
                                  <p className="text-[11px] text-slate-700 font-mono break-all">{m.liveValue}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ COMPARE MODE ══════════════════ */}
        {mode === 'compare' && (
          <div className="flex-1 overflow-y-auto md-scroll">

            {/* Score bar */}
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <span style={{
                  border: `1.5px solid ${matchScore >= 80 ? 'var(--success)' : matchScore >= 50 ? 'var(--warning)' : 'var(--error)'}`,
                  color: matchScore >= 80 ? 'var(--success)' : matchScore >= 50 ? 'var(--warning)' : 'var(--error)',
                  background: matchScore >= 80 ? 'var(--success-bg)' : matchScore >= 50 ? 'var(--warning-bg)' : 'var(--error-bg)',
                  fontSize: 13, fontWeight: 800, padding: '6px 14px', borderRadius: 'var(--radius)',
                }}>
                  Current Match: {matchScore}%
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                  {critCount} critical · {majCount} major · {minCount} minor
                </span>
                <span style={{
                  border: `1.5px solid ${projectedScore >= matchScore ? 'var(--success)' : 'var(--text-muted)'}`,
                  color: projectedScore >= matchScore ? 'var(--success)' : 'var(--text-muted)',
                  background: projectedScore >= matchScore ? 'var(--success-bg)' : 'var(--bg-muted)',
                  fontSize: 13, fontWeight: 800, padding: '6px 14px', borderRadius: 'var(--radius)',
                }}>
                  After Fixes: {projectedScore}%
                  {verdict === 'divergent' || verdict === 'unrelated' ? ' (max achievable)' : ''}
                </span>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

              {/* Sub-tab toggle: Side by Side vs Pixel Diff */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {(['side', 'diff'] as const).map(t => (
                    <button key={t} onClick={() => setCompareTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${compareTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {t === 'side' ? <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle',marginRight:3}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Side by Side</> : <><svg width="12" height="12" viewBox="0 0 24 24" style={{display:'inline',verticalAlign:'middle',marginRight:3}}><circle cx="12" cy="12" r="5" fill="#ef4444"/></svg>Pixel Diff</>}
                    </button>
                  ))}
                </div>
                {compareTab === 'diff' && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                    Red = pixels that differ from Figma design
                  </span>
                )}
              </div>

              {/* Side-by-side images */}
              {compareTab === 'side' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  <div ref={containerRef} className="flex select-none" style={{ minHeight: '480px', cursor: isDragging.current ? 'col-resize' : 'default' }}>

                    {/* Left — Live Site */}
                    <div className="flex flex-col" style={{ width: `${splitPct}%`, minWidth: 0 }}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 border-r">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>Live Site</span>
                      </div>
                      <div className="relative flex-1 overflow-hidden border-r border-slate-200">
                        {webSrc
                          ? <img src={webSrc} alt="Live Site" className="w-full h-full object-cover object-top" style={{ display: 'block' }} />
                          : <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No screenshot</div>
                        }
                        <BoxOverlays mismatches={visibleMismatches} activeIssue={activeIssue}
                          onEnter={handleBoxEnter} onLeave={handleBoxLeave} onClick={scrollToCard} />
                      </div>
                    </div>

                    {/* Draggable divider */}
                    <div className="divider flex-shrink-0 flex items-stretch cursor-col-resize z-30"
                      style={{ width: '12px', background: 'transparent' }}
                      onMouseDown={e => { isDragging.current = true; e.preventDefault(); }}>
                      <div className="divider-bar mx-auto w-1 h-full bg-slate-300 rounded-full transition-colors" />
                    </div>

                    {/* Right — Figma Design */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><svg width="11" height="11" viewBox="0 0 38 57" fill="#6366f1"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z"/><path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>Figma Design</span>
                      </div>
                      <div className="relative flex-1 overflow-hidden">
                        {figmaSrc
                          ? <img src={figmaSrc} alt="Figma Design" className="w-full h-full object-cover object-top" style={{ display: 'block' }} />
                          : <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No screenshot</div>
                        }
                        <BoxOverlays mismatches={mismatches} activeIssue={activeIssue}
                          onEnter={handleBoxEnter} onLeave={handleBoxLeave} onClick={scrollToCard} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center py-2">Drag the center divider to resize · Hover a red box to see the issue · Click to scroll to details</p>
                </div>
              )}

              {/* Pixel diff image */}
              {compareTab === 'diff' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><svg width="11" height="11" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>Pixel Difference Map</span>
                    <span className="text-[10px] text-slate-400">Every red pixel = a real visual difference detected deterministically</span>
                  </div>
                  {diffSrc ? (
                    <img src={diffSrc} alt="Pixel diff" className="w-full block" style={{ imageRendering: 'crisp-edges' }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Diff image not available</p>
                      <p className="text-xs">Re-run comparison to generate pixel diff</p>
                    </div>
                  )}
                </div>
              )}

              {/* Compact issue list below images */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-800">Issues</h3>
                  <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{visibleMismatches.length}</span>
                  {!showMinor && minCount > 0 && <span className="text-xs text-slate-400">({minCount} minor hidden)</span>}
                </div>
                <div className="divide-y divide-slate-50">
                  {visibleMismatches.map((m, i) => {
                    const cfg = getSev(m.severity);
                    const isActive = activeIssue === m.issueNumber;
                    return (
                      <button key={m.issueNumber}
                        ref={el => { cardRefs.current[i] = el; }}
                        onClick={() => scrollToCard(m.issueNumber)}
                        onMouseEnter={() => setActive(m.issueNumber)}
                        onMouseLeave={() => setActive(null)}
                        className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all ${isActive ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                        <span className="w-6 h-6 rounded-lg text-white text-[11px] font-black flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cfg.hex }}>{m.issueNumber}</span>
                        <span className="text-sm text-slate-700 font-medium flex-1 truncate">{m.title}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{ flexShrink: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '8px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{mismatches.length} issues found</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              Match: <strong style={{ color: matchScore >= 80 ? 'var(--success)' : matchScore >= 50 ? 'var(--warning)' : 'var(--error)' }}>{matchScore}%</strong>
              {' → '}
              Projected: <strong style={{ color: 'var(--success)' }}>{projectedScore}%</strong>
              {(verdict === 'divergent' || verdict === 'unrelated') && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (layout redesign needed)</span>}
            </span>
          </div>
        </div>
      </div>

    </>
  );
};

export default MatchDesignChat;