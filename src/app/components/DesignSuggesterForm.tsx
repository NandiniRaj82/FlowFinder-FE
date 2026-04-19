'use client';

import React, { useState } from 'react';

interface Props {
  onSubmit: (
    websiteUrl: string,
    selectedPresets: string[],
    customPrompts: string[],
    framework?: string,
  ) => void;
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

const PRESET_STYLES = [
  {
    key: 'minimal',
    name: 'Minimal',
    tag: 'Clean & Editorial',
    desc: 'Generous whitespace, single accent, thin borders',
    cardStyle: {
      background: '#ffffff',
      border: '2px solid',
      dotColor: '#1e293b',
      textColor: '#1e293b',
      tagColor: '#64748b',
    },
    selectedBorder: '#1e293b',
    unselectedBorder: '#e2e8f0',
  },
  {
    key: 'bold',
    name: 'Bold & Dark',
    tag: 'Powerful & Modern',
    desc: 'Dark bg, neon accents, high contrast',
    cardStyle: {
      background: '#0a0a0f',
      border: '2px solid',
      dotColor: '#60a5fa',
      textColor: '#ffffff',
      tagColor: '#93c5fd',
    },
    selectedBorder: '#3b82f6',
    unselectedBorder: '#1e293b',
  },
  {
    key: 'colorful',
    name: 'Colorful',
    tag: 'Vibrant & Creative',
    desc: 'Gradients, rounded corners, energetic feel',
    cardStyle: {
      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
      border: '2px solid',
      dotColor: '#fde68a',
      textColor: '#ffffff',
      tagColor: '#e9d5ff',
    },
    selectedBorder: '#a855f7',
    unselectedBorder: '#6d28d9',
  },
];

const WebsiteRedesignerForm: React.FC<Props> = ({ onSubmit, onBack, isProcessing }) => {
  const [websiteUrl, setWebsiteUrl]         = useState('');
  const [framework, setFramework]           = useState('html');
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['minimal', 'bold', 'colorful']);
  const [customPrompts, setCustomPrompts]   = useState<string[]>([]);
  const [showExampleFor, setShowExampleFor] = useState<number | null>(null);
  const [urlError, setUrlError]             = useState('');
  const [selError, setSelError]             = useState('');

  // Count of valid custom prompts (filled in)
  const validCustomCount = customPrompts.filter(p => p.trim().length > 5).length;
  const designCount = selectedPresets.length + validCustomCount;
  const canAddCustom = customPrompts.length < 3;

  const examples = ['https://stripe.com', 'https://linear.app', 'https://vercel.com', 'https://notion.so'];

  const togglePreset = (key: string) => {
    setSelectedPresets(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setSelError('');
  };

  const addCustomSlot = () => {
    if (customPrompts.length < 3) {
      setCustomPrompts(prev => [...prev, '']);
      setSelError('');
    }
  };

  const removeCustomSlot = (idx: number) => {
    setCustomPrompts(prev => prev.filter((_, i) => i !== idx));
    setShowExampleFor(null);
  };

  const updateCustomPrompt = (idx: number, val: string) => {
    setCustomPrompts(prev => prev.map((p, i) => (i === idx ? val : p)));
    setSelError('');
  };

  const handleSubmit = () => {
    if (!websiteUrl.startsWith('http')) {
      setUrlError('Enter a valid URL starting with https://');
      return;
    }
    if (designCount === 0) {
      setSelError('Select at least one style or add a custom design.');
      return;
    }
    setUrlError('');
    setSelError('');
    onSubmit(websiteUrl.trim(), selectedPresets, customPrompts.filter(p => p.trim().length > 5), framework);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
        .slide-down { animation: slideDown 0.25s ease-out both; }
        .preset-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .preset-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
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
                onChange={e => { setWebsiteUrl(e.target.value); setUrlError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://yourwebsite.com"
                disabled={isProcessing}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                  ${urlError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {websiteUrl && !isProcessing && (
                <button onClick={() => setWebsiteUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {urlError && <p className="mt-1.5 text-xs text-red-500">⚠️ {urlError}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {examples.map(ex => (
                <button key={ex} onClick={() => { setWebsiteUrl(ex); setUrlError(''); }} disabled={isProcessing}
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

          {/* ── Preset style toggle cards ── */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">🎨 Preset Styles</p>
              <span className="text-xs text-slate-400">
                {selectedPresets.length === 3 ? 'All selected' : `${selectedPresets.length} selected`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_STYLES.map(ps => {
                const isSelected = selectedPresets.includes(ps.key);
                return (
                  <button
                    key={ps.key}
                    onClick={() => !isProcessing && togglePreset(ps.key)}
                    disabled={isProcessing}
                    className={`preset-card relative rounded-xl p-3 text-left border-2 cursor-pointer outline-none
                      ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{
                      background: ps.cardStyle.background,
                      borderColor: isSelected ? ps.selectedBorder : ps.unselectedBorder,
                      boxShadow: isSelected ? `0 0 0 1px ${ps.selectedBorder}` : 'none',
                    }}
                    aria-pressed={isSelected}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all`}
                      style={{
                        background: isSelected ? ps.selectedBorder : 'transparent',
                        borderColor: isSelected ? ps.selectedBorder : (ps.key === 'minimal' ? '#94a3b8' : 'rgba(255,255,255,0.5)'),
                      }}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>

                    <div className="w-2 h-2 rounded-full mb-1.5" style={{ background: ps.cardStyle.dotColor }} />
                    <p className="text-xs font-black leading-tight" style={{ color: ps.cardStyle.textColor }}>
                      {ps.name}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: ps.cardStyle.tagColor }}>
                      {ps.tag}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5">Click a card to toggle. Deselect all and use only custom styles if you prefer.</p>
          </div>

          {/* ── Custom design slots ── */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-700">Custom Styles</p>
                  <p className="text-xs text-slate-400">Describe your own design — up to 3 custom styles</p>
                </div>
              </div>
              {canAddCustom && (
                <button
                  onClick={addCustomSlot}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Custom Style
                </button>
              )}
            </div>

            {/* Custom slots */}
            {customPrompts.length === 0 ? (
              <div className="px-5 py-5 text-center">
                <p className="text-xs text-slate-400">No custom styles added yet. Click "Add Custom Style" to describe your ideal design.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customPrompts.map((prompt, idx) => (
                  <div key={idx} className="px-5 py-4 slide-down">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Custom {idx + 1}
                      </span>
                      <button
                        onClick={() => removeCustomSlot(idx)}
                        disabled={isProcessing}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all text-slate-400 disabled:opacity-50"
                        title="Remove this custom style"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={e => updateCustomPrompt(idx, e.target.value)}
                      disabled={isProcessing}
                      rows={3}
                      placeholder={`Describe your Custom ${idx + 1} design… e.g. 'Dark navy background, gold accents, serif headings, luxury feel'`}
                      className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none disabled:opacity-50"
                    />
                    {/* Example dropdown toggle */}
                    <button
                      onClick={() => setShowExampleFor(showExampleFor === idx ? null : idx)}
                      className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <svg className={`w-3 h-3 transition-transform ${showExampleFor === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                      Quick examples
                    </button>
                    {showExampleFor === idx && (
                      <div className="mt-2 space-y-1.5 slide-down">
                        {CUSTOM_EXAMPLES.map((ex, ei) => (
                          <button key={ei}
                            onClick={() => { updateCustomPrompt(idx, ex); setShowExampleFor(null); }}
                            disabled={isProcessing}
                            className="w-full text-left px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                            "{ex}"
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selection error */}
          {selError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p className="text-xs font-semibold text-red-600">{selError}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-indigo-700 mb-2">How accuracy works</p>
            <div className="space-y-1">
              {[
                '① Waits for JS to fully render — catches dynamically loaded content',
                '② Scrolls entire page to trigger lazy-loaded sections',
                '③ Scrapes ALL headings, paragraphs, list items, badges, and tech stack tags',
                `④ Generates ${designCount} complete ${FRAMEWORKS.find(f => f.id === framework)?.label || 'HTML'} file${designCount !== 1 ? 's' : ''} with your exact content`,
              ].map((s, i) => <p key={i} className="text-xs text-indigo-700">{s}</p>)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={onBack} disabled={isProcessing}
              className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-400 transition-all disabled:opacity-50">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !websiteUrl || designCount === 0}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all
                ${!isProcessing && websiteUrl && designCount > 0
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Scraping &amp; generating {designCount} design{designCount !== 1 ? 's' : ''}… (~60–90s)
                </span>
              ) : designCount === 0
                ? 'Select at least one style →'
                : `Generate ${designCount} Redesign${designCount !== 1 ? 's' : ''} →`
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsiteRedesignerForm;