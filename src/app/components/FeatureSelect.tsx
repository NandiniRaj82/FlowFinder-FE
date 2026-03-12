'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface FeatureSelectProps {
  user?: { fullName: string; email: string };
  onSelect: (feature: 'accessibility' | 'match-design') => void;
}

const FeatureSelect: React.FC<FeatureSelectProps> = ({ user, onSelect }) => {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease-out both; }
        .card-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-lift:hover { transform: translateY(-6px); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex flex-col">

        {/* Header */}
        <header className="bg-white/70 backdrop-blur-md border-b border-orange-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent"
              style={{ fontFamily: '"Playfair Display", serif' }}>
              Flow Finder
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/signin'; }}
              className="px-4 py-2 bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-orange-50 transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">

          {/* Heading */}
          <div className="text-center mb-14 fade-up" style={{ animationDelay: '0s' }}>
            <p className="text-sm font-semibold text-orange-500 tracking-widest uppercase mb-3">
              Welcome back, {user?.fullName?.split(' ')[0] || 'there'} 👋
            </p>
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}>
              What would you like to do?
            </h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto">
              Choose a tool to get started. Both use AI to help you build better products.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full fade-up" style={{ animationDelay: '0.1s' }}>

            {/* Accessibility Card */}
            <div
              onClick={() => onSelect('accessibility')}
              className="card-lift cursor-pointer bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-400 shadow-lg overflow-hidden group"
            >
              {/* Top accent */}
              <div className="h-2 bg-gradient-to-r from-orange-400 to-amber-500" />

              <div className="p-8">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-200 group-hover:shadow-orange-300 transition-shadow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: '"Playfair Display", serif' }}>
                    Fix Accessibility
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-600 rounded-full">WCAG 2.1</span>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Upload your code files, import errors from the extension, and let AI suggest fixes or auto-correct all accessibility issues.
                </p>

                <ul className="space-y-2 mb-8">
                  {['Import errors from browser extension', 'AI-powered code suggestions', 'Auto-correct & download fixed files'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-mono">accessibility_fixer</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-orange-500 group-hover:gap-2.5 transition-all">
                    Get started
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Match Design Card */}
            <div
              onClick={() => onSelect('match-design')}
              className="card-lift cursor-pointer bg-white rounded-3xl border-2 border-slate-200 hover:border-violet-400 shadow-lg overflow-hidden group"
            >
              {/* Top accent */}
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />

              {/* New badge */}
              <div className="absolute mt-5 ml-auto w-full flex justify-end pr-6 pointer-events-none">
                <span className="text-xs font-black px-2.5 py-1 bg-violet-500 text-white rounded-full tracking-widest">NEW</span>
              </div>

              <div className="p-8 pt-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                  </svg>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight"
                    style={{ fontFamily: '"Playfair Display", serif' }}>
                    Match Design
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 bg-violet-100 text-violet-600 rounded-full">Figma</span>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Compare your live website against your Figma design. AI finds every mismatch in colors, fonts, spacing, and layout.
                </p>

                <ul className="space-y-2 mb-8">
                  {['Paste website URL + Figma link', 'AI compares both visually', 'Get detailed mismatch report'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-mono">design_matcher</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-violet-500 group-hover:gap-2.5 transition-all">
                    Get started
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </main>

        <footer className="py-6 text-center">
          <p className="text-sm text-slate-400">Made with ❤️ by Flow Finder Team • Powered by Gemini AI</p>
        </footer>
      </div>
    </>
  );
};

export default FeatureSelect;