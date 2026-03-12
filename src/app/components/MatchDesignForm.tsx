'use client';

import React, { useState } from 'react';

interface MatchDesignFormProps {
  onSubmit: (websiteUrl: string, figmaUrl: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const MatchDesignForm: React.FC<MatchDesignFormProps> = ({ onSubmit, onBack, isProcessing }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [figmaUrl, setFigmaUrl]     = useState('');
  const [errors, setErrors]         = useState<{ website?: string; figma?: string }>({});

  const validate = () => {
    const e: { website?: string; figma?: string } = {};
    if (!websiteUrl.startsWith('http')) e.website = 'Enter a valid URL starting with http:// or https://';
    if (!figmaUrl.includes('figma.com')) e.figma = 'Enter a valid figma.com share link';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(websiteUrl.trim(), figmaUrl.trim());
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10 fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight"
            style={{ fontFamily: '"Playfair Display", serif' }}>
            Match Design
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Paste your live website URL and Figma design link. AI will compare them and find every mismatch.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 fade-up" style={{ animationDelay: '0.1s' }}>

          {/* Website URL */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              🌐 Live Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={e => { setWebsiteUrl(e.target.value); setErrors(prev => ({ ...prev, website: undefined })); }}
              placeholder="https://yourwebsite.com"
              disabled={isProcessing}
              className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                ${errors.website
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            {errors.website && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span>⚠️</span> {errors.website}
              </p>
            )}
          </div>

          {/* Figma URL */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              🎨 Figma Design URL
            </label>
            <input
              type="url"
              value={figmaUrl}
              onChange={e => { setFigmaUrl(e.target.value); setErrors(prev => ({ ...prev, figma: undefined })); }}
              placeholder="https://www.figma.com/design/..."
              disabled={isProcessing}
              className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                ${errors.figma
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            {errors.figma && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span>⚠️</span> {errors.figma}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Use a public share link: figma.com/design/... — make sure the file is set to "Anyone with the link can view"
            </p>
          </div>

          {/* How it works */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-7">
            <p className="text-xs font-bold text-violet-700 mb-2">How it works</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                '① Screenshot your site',
                '→ ② Fetch Figma frame',
                '→ ③ Gemini Vision compares',
                '→ ④ Get mismatch report'
              ].map((step, i) => (
                <span key={i} className="text-xs text-violet-600 font-medium">{step}</span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-400 transition-all disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !websiteUrl || !figmaUrl}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all
                ${!isProcessing && websiteUrl && figmaUrl
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Comparing designs… this may take 30s
                </span>
              ) : (
                'Compare Designs →'
              )}
            </button>
          </div>
        </div>

        {/* Figma token note */}
        <div className="mt-5 text-center fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs text-slate-400">
            Requires <span className="font-semibold text-slate-500">FIGMA_API_TOKEN</span> in your backend .env —{' '}
            <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer"
              className="text-violet-500 hover:underline">
              get one here
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default MatchDesignForm;