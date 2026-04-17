'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Design {
  style: string;
  styleName: string;
  framework: string;
  frameworkLabel: string;
  ext: string;
  code: string;
  previewHtml?: string; // always HTML for iframe preview
  html?: string;        // backward compat
}

interface Stats {
  headings: number;
  paragraphs: number;
  listItems: number;
  tags: number;
  sections: number;
}

interface Props {
  designs: Design[];
  websiteUrl: string;
  pageTitle: string;
  screenshotBase64?: string;
  stats?: Stats;
  onReset: () => void;
}

const STYLE_META: Record<string, { gradient: string; border: string; badge: string; accentText: string; desc: string }> = {
  minimal:  { gradient: 'from-slate-100 to-white',                       border: 'border-slate-300 hover:border-slate-600',   badge: 'bg-slate-100 text-slate-700',     accentText: 'text-slate-700',   desc: 'Clean, editorial, whitespace-first' },
  bold:     { gradient: 'from-slate-900 to-slate-800',                   border: 'border-slate-700 hover:border-blue-500',    badge: 'bg-blue-500/20 text-blue-300',    accentText: 'text-blue-400',    desc: 'Dark, powerful, high contrast' },
  colorful: { gradient: 'from-pink-500 via-purple-500 to-indigo-500',    border: 'border-purple-300 hover:border-purple-500', badge: 'bg-purple-100 text-purple-700',   accentText: 'text-purple-600',  desc: 'Vibrant, creative, gradient-rich' },
  custom:   { gradient: 'from-amber-400 via-orange-500 to-rose-500',     border: 'border-amber-300 hover:border-amber-500',   badge: 'bg-amber-100 text-amber-700',     accentText: 'text-amber-600',   desc: 'Your custom design style' },
};

const FW_COLORS: Record<string, string> = {
  html: 'bg-orange-100 text-orange-700',
  react: 'bg-cyan-100 text-cyan-700',
  nextjs: 'bg-slate-100 text-slate-700',
  vue: 'bg-green-100 text-green-700',
  angular: 'bg-red-100 text-red-700',
};

// ── Iframe thumbnail card ─────────────────────────────────────────────────
const DesignCard = ({ design, index, onOpen }: { design: Design; index: number; onOpen: () => void }) => {
  const meta    = STYLE_META[design.style] || STYLE_META.minimal;
  const previewHtml = design.previewHtml || design.code || design.html || '';
  const fwColor = FW_COLORS[design.framework] || 'bg-slate-100 text-slate-600';

  return (
    <div onClick={onOpen}
      className={`group cursor-pointer rounded-2xl border-2 ${meta.border} bg-white shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden`}
      style={{ animation: `slideUp 0.5s ease-out ${index * 0.12}s both` }}>

      {/* Preview — always use HTML iframe */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <iframe
          title={design.styleName}
          srcDoc={previewHtml}
          sandbox="allow-scripts"
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '1440px', height: '900px', transform: 'scale(0.267)', transformOrigin: 'top left' }}
        />
        <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span className="text-sm font-bold text-slate-700">Open Preview</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="font-black text-slate-900 text-base" style={{ fontFamily: '"Playfair Display", serif' }}>{design.styleName}</h3>
          <div className="flex gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{design.style}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fwColor}`}>{design.frameworkLabel || 'HTML'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">{meta.desc}</p>
        <div className={`flex items-center gap-1 text-xs font-bold ${meta.accentText} group-hover:gap-2 transition-all`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Click to preview & download
        </div>
      </div>
    </div>
  );
};

// ── Full preview modal ────────────────────────────────────────────────────
const PreviewModal = ({ design, onClose }: { design: Design; onClose: () => void }) => {
  const code        = design.code || design.html || '';
  const previewHtml = design.previewHtml || code;
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `redesign-${design.style}-${Date.now()}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" style={{ animation: 'fadeIn 0.2s ease-out' }}>

      {/* Modal header */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"/>
            <div className="w-3 h-3 rounded-full bg-yellow-500"/>
            <div className="w-3 h-3 rounded-full bg-green-500"/>
          </div>
          <span className="text-sm font-bold text-white">{design.styleName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FW_COLORS[design.framework] || 'bg-slate-700 text-white'}`}>
            {design.frameworkLabel || 'HTML'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — always available */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>
              Preview
            </button>
            <button onClick={() => setViewMode('code')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'code' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>
              {design.frameworkLabel || 'HTML'} Code
            </button>
          </div>

          {/* Download */}
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download HTML
          </button>

          {/* Close */}
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <iframe title={`${design.styleName} preview`} srcDoc={previewHtml} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0"/>
        ) : (
          <div className="w-full h-full overflow-auto bg-slate-950 p-4">
            <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">{code}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main results ──────────────────────────────────────────────────────────
const WebsiteRedesignerResults: React.FC<Props> = ({ designs, websiteUrl, pageTitle, screenshotBase64, stats, onReset }) => {
  const [openDesign, setOpenDesign] = useState<Design | null>(null);
  const hostname = (() => { try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; } })();

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      `}</style>

      {openDesign && <PreviewModal design={openDesign} onClose={() => setOpenDesign(null)} />}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4" style={{ animation: 'slideUp 0.4s ease-out both' }}>
          <div className="flex items-center gap-4">
            {screenshotBase64 && (
              <div className="w-16 h-12 rounded-xl overflow-hidden border-2 border-slate-200 flex-shrink-0 shadow-sm">
                <img src={`data:image/jpeg;base64,${screenshotBase64}`} alt="Original" className="w-full h-full object-cover object-top"/>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 font-mono mb-0.5">{hostname}</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                {pageTitle || hostname}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{designs.length} redesigns generated · click any card to preview & download</p>
            </div>
          </div>

          <button onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            New Redesign
          </button>
        </div>

        {/* Scrape stats */}
        {stats && (
          <div className="mb-6 flex flex-wrap gap-2" style={{ animation: 'slideUp 0.4s ease-out 0.1s both' }}>
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
              ✓ {stats.headings} headings scraped
            </span>
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
              ✓ {stats.paragraphs} paragraphs
            </span>
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
              ✓ {stats.listItems} list items
            </span>
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
              ✓ {stats.tags} tags/badges
            </span>
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">
              ✓ {stats.sections} sections
            </span>
          </div>
        )}

        {/* Cards */}
        <div className={`grid grid-cols-1 gap-6 ${designs.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
          {designs.map((design, i) => (
            <DesignCard key={design.style} design={design} index={i} onOpen={() => setOpenDesign(design)} />
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Click any card to open full preview • Toggle between Preview and Code view • Download as .{designs[0]?.ext || 'html'}
        </p>
      </div>
    </>
  );
};

export default WebsiteRedesignerResults;