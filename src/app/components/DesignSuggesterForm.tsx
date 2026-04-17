'use client';

import React, { useState } from 'react';

interface Props {
  onSubmit: (websiteUrl: string, customPrompt?: string, framework?: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const FRAMEWORKS = [
  { id: 'html',    label: 'HTML/CSS/JS', icon: '🌐', desc: 'Plain HTML file, works anywhere' },
  { id: 'react',   label: 'React JSX',   icon: '⚛️',  desc: 'React component, single file' },
  { id: 'nextjs',  label: 'Next.js',     icon: '▲',  desc: 'Next.js page component' },
  { id: 'vue',     label: 'Vue.js',      icon: '💚',  desc: 'Vue 3 SFC (.vue file)' },
  { id: 'angular', label: 'Angular',     icon: '🔴',  desc: 'Angular standalone component' },
];

const CUSTOM_EXAMPLES = [
  'Dark navy (#0F172A) background, gold accent (#F59E0B), Playfair Display headings, luxury feel',
  'Pastel pink and mint green, very rounded bubbly cards, Nunito font, playful and fun',
  'Pure black and white, brutalist grid, massive bold typography, zero rounded corners',
  'Earthy greens and browns, organic shapes, nature-inspired, warm and calm feel',
  'Glassmorphism — blurred frosted cards, purple to blue gradient, dark background',
];

const WebsiteRedesignerForm: React.FC<Props> = ({ onSubmit, onBack, isProcessing }) => {
  const [websiteUrl, setWebsiteUrl]     = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [framework, setFramework]       = useState('html');
  const [showCustom, setShowCustom]     = useState(false);
  const [error, setError]               = useState('');

  const validate = () => {
    if (!websiteUrl.startsWith('http')) { setError('Enter a valid URL starting with https://'); return false; }
    setError(''); return true;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(websiteUrl.trim(), customPrompt.trim() || undefined, framework);
  };

  const designCount = showCustom && customPrompt.trim().length > 5 ? 4 : 3;
  const examples = ['https://stripe.com', 'https://linear.app', 'https://vercel.com', 'https://notion.so'];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* Header */}
        <div className="text-center mb-8 fade-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Website Redesigner
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            AI scrapes every piece of content from your URL and generates complete redesigns — same content, new look.
          </p>
        </div>

        <div className="space-y-5 fade-up" style={{ animationDelay: '0.1s' }}>

          {/* URL */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-2">🌐 Website URL</label>
            <div className="relative">
              <input type="url" value={websiteUrl}
                onChange={e => { setWebsiteUrl(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://yourwebsite.com"
                disabled={isProcessing}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                  ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {websiteUrl && !isProcessing && (
                <button onClick={() => setWebsiteUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">⚠️ {error}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {examples.map(ex => (
                <button key={ex} onClick={() => { setWebsiteUrl(ex); setError(''); }} disabled={isProcessing}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 font-mono transition-all">
                  {ex.replace('https://', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Framework selector */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">⚙️ Output Framework</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FRAMEWORKS.map(fw => (
                <button key={fw.id} onClick={() => setFramework(fw.id)} disabled={isProcessing}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                    ${framework === fw.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <span className="text-lg flex-shrink-0">{fw.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{fw.label}</p>
                    <p className="text-[10px] opacity-60 truncate">{fw.desc}</p>
                  </div>
                  {framework === fw.id && (
                    <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3 style previews */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700 mb-3">🎨 Included Styles (always generated)</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Minimal', desc: 'Clean & editorial', bg: 'bg-white border-slate-300', dot: 'bg-slate-800', text: 'text-slate-700' },
                { name: 'Bold & Dark', desc: 'Powerful & modern', bg: 'bg-slate-900 border-slate-700', dot: 'bg-blue-400', text: 'text-white' },
                { name: 'Colorful', desc: 'Vibrant & creative', bg: 'bg-gradient-to-br from-pink-400 to-indigo-500 border-purple-300', dot: 'bg-yellow-300', text: 'text-white' },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border-2 ${s.bg} p-3`}>
                  <div className={`w-2 h-2 rounded-full ${s.dot} mb-1.5`} />
                  <p className={`text-xs font-black ${s.text}`}>{s.name}</p>
                  <p className={`text-[10px] ${s.text} opacity-70`}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom style */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setShowCustom(!showCustom)} disabled={isProcessing}
              className={`w-full flex items-center justify-between px-5 py-4 transition-all
                ${showCustom ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                <div className="text-left">
                  <p className="text-sm font-bold">+ Add Custom Style</p>
                  <p className="text-xs opacity-60">Describe your own design — generates a 4th option</p>
                </div>
              </div>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${showCustom ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {showCustom && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                  disabled={isProcessing} rows={3}
                  placeholder="Describe your ideal design... e.g. 'Dark navy background, gold accents, serif headings, luxury feel with glassmorphism cards and smooth fade animations'"
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none disabled:opacity-50"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Quick examples — click to use:</p>
                  <div className="space-y-1.5">
                    {CUSTOM_EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setCustomPrompt(ex)} disabled={isProcessing}
                        className="w-full text-left px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-indigo-700 mb-2">How accuracy works</p>
            <div className="space-y-1">
              {[
                '① Waits for JS to fully render — catches dynamically loaded content',
                '② Scrolls entire page to trigger lazy-loaded sections',
                '③ Scrapes ALL headings, paragraphs, list items, badges, and tech stack tags',
                `④ Generates ${designCount} complete ${FRAMEWORKS.find(f => f.id === framework)?.label} files with your exact content`,
              ].map((s, i) => <p key={i} className="text-xs text-indigo-700">{s}</p>)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={onBack} disabled={isProcessing}
              className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-400 transition-all disabled:opacity-50">
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={isProcessing || !websiteUrl}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all
                ${!isProcessing && websiteUrl
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Scraping & generating {designCount} {FRAMEWORKS.find(f => f.id === framework)?.label} files… (~60-90s)
                </span>
              ) : `Generate ${designCount} ${FRAMEWORKS.find(f => f.id === framework)?.label} Redesigns →`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsiteRedesignerForm;