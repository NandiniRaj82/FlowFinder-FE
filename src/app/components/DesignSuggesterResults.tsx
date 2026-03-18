'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Design {
  style: 'minimal' | 'bold' | 'colorful';
  styleName: string;
  html: string;
}

interface Props {
  designs: Design[];
  websiteUrl: string;
  pageTitle: string;
  screenshotBase64?: string;
  onReset: () => void;
}

const STYLE_META = {
  minimal: {
    gradient: 'from-slate-100 to-white',
    border: 'border-slate-300 hover:border-slate-500',
    activeBorder: 'border-slate-800',
    badge: 'bg-slate-100 text-slate-700',
    icon: '◻',
    accentBg: 'bg-slate-800',
    accentText: 'text-slate-800',
    desc: 'Clean, editorial, generous whitespace',
    previewBg: '#ffffff',
  },
  bold: {
    gradient: 'from-slate-900 to-slate-800',
    border: 'border-slate-700 hover:border-blue-500',
    activeBorder: 'border-blue-500',
    badge: 'bg-blue-500/20 text-blue-300',
    icon: '◼',
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-400',
    desc: 'Dark, powerful, high contrast',
    previewBg: '#0a0a0f',
  },
  colorful: {
    gradient: 'from-pink-500 via-purple-500 to-indigo-500',
    border: 'border-purple-300 hover:border-purple-500',
    activeBorder: 'border-purple-500',
    badge: 'bg-purple-100 text-purple-700',
    icon: '◈',
    accentBg: 'bg-gradient-to-r from-pink-500 to-indigo-500',
    accentText: 'text-purple-600',
    desc: 'Vibrant, creative, gradient-rich',
    previewBg: '#f8f0ff',
  },
};

// ── Preview card ──────────────────────────────────────────────────────────
const DesignCard = ({ design, index, onOpen }: { design: Design; index: number; onOpen: () => void }) => {
  const meta    = STYLE_META[design.style];
  // const iframeRef = useRef<HTMLIFrameElement>(null);

  // useEffect(() => {
  //   if (iframeRef.current) {
  //     const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
  //     if (doc) {
  //       doc.open();
  //       doc.write(design.html);
  //       doc.close();
  //     }
  //   }
  // }, [design.html]);

  return (
    <div
      className={`group cursor-pointer rounded-3xl border-2 ${meta.border} bg-white shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden`}
      style={{ animation: `slideUp 0.5s ease-out ${index * 0.12}s both` }}
      onClick={onOpen}
    >
      {/* Live iframe preview thumbnail */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <iframe
          title={design.styleName}
          srcDoc={design.html}
          sandbox="allow-scripts"
          className="absolute top-0 left-0 w-full border-0 pointer-events-none"
          style={{
            width: '1440px',
            height: '900px',
            transform: 'scale(0.278)',
            transformOrigin: 'top left',
          }}
        />
        {/* Click overlay */}
        <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span className="text-sm font-bold text-slate-700">Open Preview</span>
          </div>
        </div>
      </div>

      {/* Card info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-black text-slate-900 text-lg" style={{ fontFamily: '"Playfair Display", serif' }}>
              {design.styleName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>
            {design.style}
          </span>
        </div>

        <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${meta.accentText} group-hover:gap-2.5 transition-all`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Click to open full preview
        </div>
      </div>
    </div>
  );
};

// ── Full preview modal ────────────────────────────────────────────────────
const PreviewModal = ({ design, onClose }: { design: Design; onClose: () => void }) => {
  // const iframeRef = useRef<HTMLIFrameElement>(null);
  const meta = STYLE_META[design.style];

  // useEffect(() => {
  //   if (iframeRef.current) {
  //     const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
  //     if (doc) { doc.open(); doc.write(design.html); doc.close(); }
  //   }
  // }, [design.html]);

  const handleDownload = () => {
    const blob = new Blob([design.html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `redesign-${design.style}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col"
      style={{ animation: 'fadeIn 0.2s ease-out' }}>

      {/* Modal header */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-bold text-white">{design.styleName}</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${meta.badge}`}>
            {design.style}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Download button */}
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm">
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

      {/* Full iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          title={`${design.styleName} full preview`}
          srcDoc={design.html}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

// ── Main results component ────────────────────────────────────────────────
const WebsiteRedesignerResults: React.FC<Props> = ({ designs, websiteUrl, pageTitle, screenshotBase64, onReset }) => {
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
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4"
          style={{ animation: 'slideUp 0.4s ease-out both' }}>
          <div className="flex items-center gap-4">
            {/* Original screenshot thumbnail */}
            {screenshotBase64 && (
              <div className="w-16 h-12 rounded-xl overflow-hidden border-2 border-slate-200 flex-shrink-0 shadow-sm">
                <img src={`data:image/jpeg;base64,${screenshotBase64}`} alt="Original"
                  className="w-full h-full object-cover object-top" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                <span className="text-xs text-slate-400 font-mono">{hostname}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight"
                style={{ fontFamily: '"Playfair Display", serif' }}>
                {pageTitle || hostname}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                3 redesigns generated · click any card to open full preview
              </p>
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

        {/* Design cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {designs.map((design, i) => (
            <DesignCard
              key={design.style}
              design={design}
              index={i}
              onOpen={() => setOpenDesign(design)}
            />
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Click any card to open a full-screen preview • Download the HTML to use it directly
        </p>
      </div>
    </>
  );
};

export default WebsiteRedesignerResults;