'use client';

import React, { useState } from 'react';

interface WebsiteRedesignerFormProps {
  onSubmit: (websiteUrl: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const WebsiteRedesignerForm: React.FC<WebsiteRedesignerFormProps> = ({ onSubmit, onBack, isProcessing }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!websiteUrl.startsWith('http')) {
      setError('Enter a valid URL starting with https://');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = () => { if (validate()) onSubmit(websiteUrl.trim()); };

  const examples = ['https://stripe.com', 'https://linear.app', 'https://notion.so', 'https://vercel.com'];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10 fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Website Redesigner
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Paste any website URL. AI will scrape the content and generate 3 completely different redesigned versions  Minimal, Bold & Dark, and Colorful.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 fade-up" style={{ animationDelay: '0.1s' }}>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">🌐 Website URL</label>
            <div className="relative">
              <input type="url" value={websiteUrl}
                onChange={e => { setWebsiteUrl(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://yourwebsite.com"
                disabled={isProcessing}
                className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all pr-10
                  ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {websiteUrl && !isProcessing && (
                <button onClick={() => setWebsiteUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">⚠️ {error}</p>}
          </div>

          {/* Examples */}
          <div className="mb-7">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {examples.map(ex => (
                <button key={ex} onClick={() => { setWebsiteUrl(ex); setError(''); }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-mono">
                  {ex.replace('https://', '')}
                </button>
              ))}
            </div>
          </div>

          {/* 3 style previews */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { name: 'Minimal', desc: 'Clean & editorial', color: 'from-slate-100 to-white', border: 'border-slate-300', text: 'text-slate-700', dot: 'bg-slate-800' },
              { name: 'Bold & Dark', desc: 'Powerful & modern', color: 'from-slate-900 to-slate-800', border: 'border-slate-700', text: 'text-white', dot: 'bg-blue-400' },
              { name: 'Colorful', desc: 'Vibrant & creative', color: 'from-pink-400 via-purple-400 to-indigo-500', border: 'border-purple-300', text: 'text-white', dot: 'bg-yellow-300' },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border-2 ${s.border} bg-gradient-to-br ${s.color} p-4`}>
                <div className={`w-3 h-3 rounded-full ${s.dot} mb-2`} />
                <p className={`text-xs font-black ${s.text}`}>{s.name}</p>
                <p className={`text-[10px] ${s.text} opacity-70 mt-0.5`}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-7">
            <p className="text-xs font-bold text-indigo-700 mb-2">What happens</p>
            <div className="space-y-1">
              {[
                '① AI scrapes all content from the URL (text, headings, nav, sections)',
                '② Generates 3 full HTML pages with the same content, different styles',
                '③ Preview each design, download the one you like',
              ].map((s, i) => (
                <p key={i} className="text-xs text-indigo-700">{s}</p>
              ))}
            </div>
          </div>

          {/* Buttons */}
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
                  Generating 3 redesigns… (~60s)
                </span>
              ) : 'Generate Redesigns →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsiteRedesignerForm;