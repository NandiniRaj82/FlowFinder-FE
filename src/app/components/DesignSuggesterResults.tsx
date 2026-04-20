'use client';

import React, { useState, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────── */
/* Types */
/* ──────────────────────────────────────────────────────────── */

interface Design {
  style: string;
  styleName: string;
  framework: string;
  frameworkLabel: string;
  ext: string;
  code: string;
  previewHtml?: string;
  html?: string;
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
  isStreaming?: boolean;
  pendingStyles?: string[];
}

/* ──────────────────────────────────────────────────────────── */
/* Style Config */
/* ──────────────────────────────────────────────────────────── */

const STYLE_META: Record<string, { gradient: string; badge: string; desc: string }> = {
  minimal: { gradient: 'from-slate-100 to-white', desc: 'Clean minimal UI', badge: 'bg-slate-100 text-slate-700' },
  bold: { gradient: 'from-slate-900 to-slate-800', desc: 'Dark modern UI', badge: 'bg-blue-500/20 text-blue-300' },
  colorful: { gradient: 'from-pink-500 via-purple-500 to-indigo-500', desc: 'Creative colorful UI', badge: 'bg-purple-100 text-purple-700' },
  custom: { gradient: 'from-amber-400 via-orange-500 to-rose-500', desc: 'Custom style', badge: 'bg-amber-100 text-amber-700' },
  custom_1: { gradient: 'from-amber-400 via-orange-500 to-rose-500', desc: 'Custom 1', badge: 'bg-amber-100 text-amber-700' },
  custom_2: { gradient: 'from-emerald-400 via-teal-500 to-cyan-500', desc: 'Custom 2', badge: 'bg-emerald-100 text-emerald-700' },
  custom_3: { gradient: 'from-rose-400 via-red-500 to-orange-500', desc: 'Custom 3', badge: 'bg-rose-100 text-rose-700' },
};

const FALLBACK_META = STYLE_META.minimal;

/* ──────────────────────────────────────────────────────────── */
/* Modal */
/* ──────────────────────────────────────────────────────────── */

const PreviewModal = ({ design, onClose }: { design: Design; onClose: () => void }) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const code = design.code || design.html || '';

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-${design.style}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="bg-slate-900 text-white flex justify-between items-center px-4 py-2">
        <span>{design.styleName}</span>

        <div className="flex gap-2">
          <button onClick={() => setViewMode('preview')} className="text-xs">Preview</button>
          <button onClick={() => setViewMode('code')} className="text-xs">Code</button>
          <button onClick={handleDownload} className="text-xs">Download</button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <iframe
          srcDoc={design.previewHtml || code}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <pre className="text-green-400 bg-black p-4 overflow-auto h-full text-xs">
          {code}
        </pre>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────── */
/* Main Component */
/* ──────────────────────────────────────────────────────────── */

const WebsiteRedesignerResults: React.FC<Props> = ({
  designs,
  websiteUrl,
  pageTitle,
  screenshotBase64,
  stats,
  onReset,
  isStreaming,
  pendingStyles = [],
}) => {

  const [openDesign, setOpenDesign] = useState<Design | null>(null);

  const hostname = (() => {
    try { return new URL(websiteUrl).hostname; }
    catch { return websiteUrl; }
  })();

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {openDesign && <PreviewModal design={openDesign} onClose={() => setOpenDesign(null)} />}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {screenshotBase64 && (
              <img src={`data:image/jpeg;base64,${screenshotBase64}`} className="w-16 h-12 rounded border" />
            )}
            <div>
              <p className="text-xs text-gray-400">{hostname}</p>
              <h2 className="text-xl font-bold">{pageTitle || hostname}</h2>
              <p className="text-sm text-gray-500">
                {isStreaming
                  ? `${designs.length} ready • ${pendingStyles.length} loading`
                  : `${designs.length} designs generated`}
              </p>
            </div>
          </div>

          <button onClick={onReset} className="border px-3 py-1 rounded">
            New
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Generated Designs */}
          {designs.map((design, i) => {
            const meta = STYLE_META[design.style] || FALLBACK_META;

            return (
              <div
                key={design.style}
                onClick={() => setOpenDesign(design)}
                className="cursor-pointer border rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                style={{ animation: `slideUp 0.4s ${i * 0.1}s both` }}
              >
                <div className="h-52 bg-gray-100 relative overflow-hidden">
                  <iframe
                    srcDoc={design.previewHtml || design.code || ''}
                    className="absolute top-0 left-0 border-0 pointer-events-none"
                    style={{
                      width: '1400px',
                      height: '900px',
                      transform: 'scale(0.25)',
                      transformOrigin: 'top left'
                    }}
                  />
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-sm">{design.styleName}</h3>
                  <p className="text-xs text-gray-500">{meta.desc}</p>
                </div>
              </div>
            );
          })}

          {/* Skeletons */}
          {pendingStyles.map((style, i) => {
            const meta = STYLE_META[style] || FALLBACK_META;

            return (
              <div key={style} className="border rounded-xl overflow-hidden shadow">
                <div className={`h-52 bg-gradient-to-br ${meta.gradient} relative`}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.2) 50%,transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                    <p className="text-white text-xs mt-2">Generating...</p>
                  </div>
                </div>

                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span>✓ {stats.headings} headings</span>
            <span>✓ {stats.paragraphs} paragraphs</span>
            <span>✓ {stats.listItems} list items</span>
          </div>
        )}

      </div>
    </>
  );
};

export default WebsiteRedesignerResults;