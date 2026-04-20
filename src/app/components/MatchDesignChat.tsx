'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

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
  onReset: () => void;
}

/* ─── Severity config ────────────────────────────────────────────────────── */
const SEV: Record<string, { bg: string; text: string; hex: string; label: string }> = {
  critical: { bg: 'bg-red-100',    text: 'text-red-700',    hex: '#ef4444', label: 'Critical' },
  major:    { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316', label: 'Major'    },
  minor:    { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', label: 'Minor'    },
};
const getSev = (s: string) => SEV[(s || 'minor').toLowerCase()] ?? SEV.minor;

/* ─── Score helpers ──────────────────────────────────────────────────────── */
function scoreMeta(score: number) {
  if (score >= 80) return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-300', stroke: '#22c55e', label: 'Great'      };
  if (score >= 50) return { cls: 'bg-orange-100  text-orange-700  border-orange-300',  stroke: '#f97316', label: 'Needs Work' };
  return               { cls: 'bg-red-100     text-red-700     border-red-300',     stroke: '#ef4444', label: 'Poor'       };
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
  onReset,
}) => {
  const [mode, setMode]           = useState<'issues' | 'compare'>('issues');
  const [compareTab, setCompareTab] = useState<'side' | 'diff'>('side');
  const [activeIssue, setActive]  = useState<number | null>(null);
  const [splitPct, setSplit]      = useState(50);
  const [tooltip, setTooltip]     = useState<{ x: number; y: number; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging   = useRef(false);
  const cardRefs     = useRef<(HTMLElement | null)[]>([]);

  const critCount = mismatches.filter(m => m.severity === 'critical').length;
  const majCount  = mismatches.filter(m => m.severity === 'major').length;
  const minCount  = mismatches.filter(m => m.severity === 'minor').length;
  const hostname  = (() => { try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; } })();
  const sm        = scoreMeta(matchScore);

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
  const webSrc   = websiteScreenshot ? `data:image/png;base64,${websiteScreenshot}`  : '';
  const figmaSrc = figmaScreenshot   ? `data:image/png;base64,${figmaScreenshot}`    : '';
  const diffSrc  = diffImageBase64   ? `data:image/png;base64,${diffImageBase64}`    : '';

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
              <div className="flex bg-slate-100 rounded-xl p-1">
                {(['issues', 'compare'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {m === 'issues' ? '💬 Issues' : '🔍 Compare'}
                  </button>
                ))}
              </div>
              {/* Score pill */}
              <span className={`border text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${sm.cls}`}>
                🎯 {matchScore}% match
              </span>
              <span className="text-xs text-slate-400">{critCount} critical · {majCount} major · {minCount} minor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden md:block truncate max-w-[180px]">🌐 {hostname}</span>
              <button onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-violet-300 shadow-sm transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
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
                  <h2 className="text-base font-black text-slate-800 mb-1">📊 Design Match Score</h2>
                  <p className="text-xs text-slate-400 mb-7">Pixel-accurate comparison — every differing pixel detected deterministically</p>
                  <div className="flex items-center justify-around gap-6 flex-wrap">
                    <ScoreRing score={matchScore}     label="Current Match"  sub="Before fixes" />
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-black shadow-md"
                        style={{ animation: 'popIn .6s .8s both' }}>
                        +{projectedScore - matchScore}% gain
                      </div>
                    </div>
                    <ScoreRing score={projectedScore} label="After All Fixes" sub="Projected score" />
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Issues by severity</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Critical', count: critCount, color: 'bg-red-500',    note: 'Color / major visual diff' },
                        { label: 'Major',    count: majCount,  color: 'bg-orange-500', note: 'Layout / font / content' },
                        { label: 'Minor',    count: minCount,  color: 'bg-yellow-400', note: 'Spacing / radius / weight' },
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
                  <h2 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
                    📋 All Issues
                    <span className="text-sm font-bold text-violet-600 bg-violet-100 px-2.5 py-0.5 rounded-full">{mismatches.length}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">Switch to 🔍 Compare to see issues highlighted on screenshots</p>
                  <div className="space-y-3">
                    {mismatches.map((m, i) => {
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
                            <p className="text-[11px] text-violet-500 font-medium mb-1.5">📍 {m.location}</p>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{m.description}</p>
                            {m.figmaValue && m.figmaValue !== 'N/A' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-bold text-emerald-700 mb-0.5">🎨 Figma</p>
                                  <p className="text-[11px] text-emerald-800 font-mono break-all">{m.figmaValue}</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-bold text-red-700 mb-0.5">🌐 Live Site</p>
                                  <p className="text-[11px] text-red-800 font-mono break-all">{m.liveValue}</p>
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
            <div className="bg-white border-b border-slate-100 px-6 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
                <span className={`border text-sm font-black px-4 py-2 rounded-xl ${sm.cls}`}>
                  Current Match: {matchScore}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {critCount} critical · {majCount} major · {minCount} minor
                </span>
                <span className="border text-sm font-black px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 border-emerald-300">
                  After Fixes: 100% ✓
                </span>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

              {/* Sub-tab toggle: Side by Side vs Pixel Diff */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {(['side','diff'] as const).map(t => (
                    <button key={t} onClick={() => setCompareTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        compareTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}` }>
                      {t === 'side' ? '↔ Side by Side' : '🔴 Pixel Diff'}
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
                      <span className="text-xs font-bold text-slate-600">🌐 Live Site</span>
                    </div>
                    <div className="relative flex-1 overflow-hidden border-r border-slate-200">
                      {webSrc
                        ? <img src={webSrc} alt="Live Site" className="w-full h-full object-cover object-top" style={{ display: 'block' }} />
                        : <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No screenshot</div>
                      }
                      <BoxOverlays mismatches={mismatches} activeIssue={activeIssue}
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
                      <span className="text-xs font-bold text-slate-600">🎨 Figma Design</span>
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
                  <span className="text-xs font-bold text-slate-600">🔴 Pixel Difference Map</span>
                  <span className="text-[10px] text-slate-400">Every red pixel = a real visual difference detected deterministically</span>
                </div>
                {diffSrc ? (
                  <img src={diffSrc} alt="Pixel diff" className="w-full block" style={{ imageRendering: 'crisp-edges' }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
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
                  <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{mismatches.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {mismatches.map((m, i) => {
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

        {/* Status footer */}
        <div className="flex-shrink-0 bg-white border-t border-slate-100 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
            <span>✓ {mismatches.length} issues found</span>
            <span className="font-mono">
              Match: <strong className={matchScore >= 80 ? 'text-emerald-500' : matchScore >= 50 ? 'text-orange-500' : 'text-red-500'}>{matchScore}%</strong>
              {' → '}
              Projected: <strong className="text-emerald-500">{projectedScore}%</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchDesignChat;