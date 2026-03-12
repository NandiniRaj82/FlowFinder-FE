'use client';

import React, { useState } from 'react';
import UploadSection from './uploadSection';
import ChoiceCards from './choiceSection';
import AccessibilityChat from './AccessibilityChat';
import FeatureSelect from './FeatureSelect';
import MatchDesignForm from './MatchDesignForm';
import MatchDesignChat from './MatchDesignChat';

interface DashboardProps {
  user?: {
    fullName: string;
    email: string;
  };
}

type AppStage = 'upload' | 'choice' | 'chat';
type Feature  = 'accessibility' | 'match-design' | null;

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  /* ── Feature selection (shown right after login) ─────────────────────── */
  const [feature, setFeature] = useState<Feature>(null);

  /* ── Accessibility flow state ─────────────────────────────────────────── */
  const [uploadedFiles, setUploadedFiles]           = useState<File[]>([]);
  const [accessibilityErrors, setAccessibilityErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing]             = useState(false);
  const [stage, setStage]                           = useState<AppStage>('upload');
  const [selectedChoice, setSelectedChoice]         = useState<'suggestions' | 'full-correction' | null>(null);
  const [apiResult, setApiResult]                   = useState<any>(null);

  /* ── Match Design flow state ──────────────────────────────────────────── */
  const [matchStage, setMatchStage]         = useState<'form' | 'chat'>('form');
  const [matchProcessing, setMatchProcessing] = useState(false);
  const [matchMismatches, setMatchMismatches] = useState<any[]>([]);
  const [matchWebsiteUrl, setMatchWebsiteUrl] = useState('');
  const [matchFigmaUrl, setMatchFigmaUrl]     = useState('');

  /* ── Reset everything back to feature select ──────────────────────────── */
  const handleFullReset = () => {
    setFeature(null);
    // accessibility
    setUploadedFiles([]);
    setAccessibilityErrors([]);
    setIsProcessing(false);
    setSelectedChoice(null);
    setApiResult(null);
    setStage('upload');
    // match design
    setMatchStage('form');
    setMatchProcessing(false);
    setMatchMismatches([]);
    setMatchWebsiteUrl('');
    setMatchFigmaUrl('');
  };

  /* ── Accessibility: Step 1 ────────────────────────────────────────────── */
  const handleFileUpload = (files: File[], errors?: any[]) => {
    const totalSize   = files.reduce((sum, f) => sum + f.size, 0);
    const maxTotal    = 500 * 1024 * 1024;
    const maxPerFile  = 200 * 1024 * 1024;

    if (totalSize > maxTotal) {
      alert(`Total file size too large! Maximum is 500MB. Your total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    const oversized = files.filter(f => f.size > maxPerFile);
    if (oversized.length > 0) {
      alert(`Some files are too large! Maximum per file: 200MB\n\n${oversized.map(f => `- ${f.name}: ${(f.size/1024/1024).toFixed(2)}MB`).join('\n')}`);
      return;
    }

    setUploadedFiles(files);
    setAccessibilityErrors(errors || []);
    setStage('choice');
  };

  /* ── Accessibility: Step 2 ────────────────────────────────────────────── */
  const handleChoiceSelect = async (choice: 'suggestions' | 'full-correction') => {
    if (!uploadedFiles.length) { alert('No files uploaded'); return; }

    setSelectedChoice(choice);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      uploadedFiles.forEach(f => formData.append('files', f));
      formData.append('errors', JSON.stringify(accessibilityErrors));
      formData.append('choice', choice);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated. Please login again.');

      const response = await fetch('http://localhost:5000/api/accessibility/process', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Processing failed');
      }

      if (choice === 'suggestions') {
        const data = await response.json();
        console.log('RAW API RESULT:', JSON.stringify(data.results, null, 2));
        const allSuggestions = data.results
          .filter((r: any) => r.success && r.suggestions)
          .flatMap((r: any) => Array.isArray(r.suggestions) ? r.suggestions : [r.suggestions]);
        setApiResult(allSuggestions);
      } else {
        const blob = await response.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `corrected-files-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setApiResult([{ success: true, message: `Successfully corrected ${uploadedFiles.length} file(s)`, fileCount: uploadedFiles.length }]);
      }

      setStage('chat');
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('FILE_TOO_LARGE'))     msg = 'One or more files are too large. Maximum: 200MB per file.';
      else if (msg.includes('INVALID_FILE_TYPE')) msg = 'Invalid file type. Please upload HTML, CSS, JS, TS, JSX, TSX, or ZIP files only.';
      else if (msg.includes('Not authenticated')) {
        msg = 'Session expired. Please login again.';
        setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000);
      }
      alert(`❌ Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccessibilityReset = () => {
    setUploadedFiles([]);
    setAccessibilityErrors([]);
    setIsProcessing(false);
    setSelectedChoice(null);
    setApiResult(null);
    setStage('upload');
  };

  /* ── Match Design: submit ─────────────────────────────────────────────── */
  const handleMatchSubmit = async (websiteUrl: string, figmaUrl: string) => {
    setMatchProcessing(true);
    setMatchWebsiteUrl(websiteUrl);
    setMatchFigmaUrl(figmaUrl);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated. Please login again.');

      const response = await fetch('http://localhost:5000/api/match-design', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl, figmaUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Comparison failed');
      }

      const data = await response.json();
      setMatchMismatches(data.mismatches || []);
      setMatchStage('chat');
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('Not authenticated')) {
        msg = 'Session expired. Please login again.';
        setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000);
      }
      alert(`❌ Error: ${msg}`);
    } finally {
      setMatchProcessing(false);
    }
  };

  const handleMatchReset = () => {
    setMatchStage('form');
    setMatchMismatches([]);
    setMatchWebsiteUrl('');
    setMatchFigmaUrl('');
  };

  /* ── Derived display values ───────────────────────────────────────────── */
  const totalFiles      = uploadedFiles.length;
  const totalSize       = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const displayFileName = totalFiles === 1 ? uploadedFiles[0]?.name : `${totalFiles} file(s)`;

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-float    { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
        .animate-fade-in  { animation: fadeIn 0.4s ease-out forwards; }
        .glass-effect {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      {/* ── Feature Select Screen (no header/footer needed) ──────────────── */}
      {feature === null && (
        <FeatureSelect user={user} onSelect={setFeature} />
      )}

      {/* ── Accessibility + Match Design screens (share header) ──────────── */}
      {feature !== null && (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden flex flex-col">

          {/* Loading overlay */}
          {(isProcessing || matchProcessing) && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
                <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${feature === 'match-design' ? 'border-violet-500' : 'border-orange-500'}`} />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {feature === 'match-design'
                    ? 'Comparing designs with Gemini Vision…'
                    : `Processing ${totalFiles} file(s) with Gemini AI…`}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature === 'match-design'
                    ? 'Screenshotting site, fetching Figma, running comparison. This takes ~30s.'
                    : `Analyzing and fixing your code. This may take ${totalFiles > 5 ? 'a few minutes' : 'a moment'}.`}
                </p>
              </div>
            </div>
          )}

          {/* Decorative blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-500/20 blur-3xl animate-float" />
            <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-rose-400/20 to-orange-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/20 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
          </div>

          {/* Header */}
          <header className="relative z-10 glass-effect border-b border-orange-200/50 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
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

              <div className="flex items-center space-x-4">
                {/* Breadcrumb — accessibility only */}
                {feature === 'accessibility' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={stage === 'upload' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Upload</span>
                    <span>›</span>
                    <span className={stage === 'choice' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Choose</span>
                    <span>›</span>
                    <span className={stage === 'chat' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Results</span>
                  </div>
                )}

                {/* Breadcrumb — match design */}
                {feature === 'match-design' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={matchStage === 'form' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>URLs</span>
                    <span>›</span>
                    <span className={matchStage === 'chat' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>Results</span>
                  </div>
                )}

                {/* Back to feature select */}
                <button
                  onClick={handleFullReset}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:border-slate-400 transition-all bg-white/60"
                >
                  ← Home
                </button>

                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-600">{user?.email}</p>
                </div>
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/signin'; }}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className={`relative z-10 flex-1 ${
            (feature === 'accessibility' && stage === 'chat') ||
            (feature === 'match-design'  && matchStage === 'chat')
              ? ''
              : 'max-w-7xl mx-auto w-full px-6 py-12'
          }`}>

            {/* ── Accessibility flow ──────────────────────────────────────── */}
            {feature === 'accessibility' && (
              <>
                {stage === 'upload' && (
                  <div className="animate-slide-up">
                    <UploadSection onFileUpload={handleFileUpload} />
                  </div>
                )}

                {stage === 'choice' && (
                  <div className="animate-fade-in">
                    {/* File list */}
                    <div className="mb-6 p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-orange-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Files Ready for Processing
                      </h3>

                      {totalFiles <= 5 ? (
                        <ul className="space-y-2">
                          {uploadedFiles.map((file, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm">
                              <span className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full text-xs font-bold">{idx + 1}</span>
                              <span className="flex-1 text-slate-700 font-medium truncate">{file.name}</span>
                              <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-700">
                          <p className="mb-2">{totalFiles} files selected</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-orange-600 hover:text-orange-700 font-medium">View all files</summary>
                            <ul className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                              {uploadedFiles.map((file, idx) => (
                                <li key={idx} className="text-xs text-slate-600 flex justify-between">
                                  <span className="truncate">{idx + 1}. {file.name}</span>
                                  <span className="ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-orange-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600">Total: <span className="font-semibold text-slate-800">{totalFiles} file(s)</span></span>
                        <span className="text-slate-600">Size: <span className="font-semibold text-slate-800">{(totalSize / 1024 / 1024).toFixed(2)} MB</span></span>
                      </div>
                    </div>

                    <ChoiceCards
                      fileName={displayFileName}
                      onChoiceSelect={handleChoiceSelect}
                      onReset={handleAccessibilityReset}
                      isProcessing={isProcessing}
                    />
                  </div>
                )}

                {stage === 'chat' && (
                  <div className="animate-fade-in h-full">
                    <AccessibilityChat
                      errors={apiResult}
                      fileName={displayFileName}
                      initialChoice={selectedChoice!}
                      onReset={handleAccessibilityReset}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── Match Design flow ───────────────────────────────────────── */}
            {feature === 'match-design' && (
              <>
                {matchStage === 'form' && (
                  <div className="animate-slide-up">
                    <MatchDesignForm
                      onSubmit={handleMatchSubmit}
                      onBack={handleFullReset}
                      isProcessing={matchProcessing}
                    />
                  </div>
                )}

                {matchStage === 'chat' && (
                  <div className="animate-fade-in h-full">
                    <MatchDesignChat
                      mismatches={matchMismatches}
                      websiteUrl={matchWebsiteUrl}
                      figmaUrl={matchFigmaUrl}
                      onReset={handleMatchReset}
                    />
                  </div>
                )}
              </>
            )}

          </main>

          {/* Footer — hidden in chat stages */}
          {!(
            (feature === 'accessibility' && stage === 'chat') ||
            (feature === 'match-design'  && matchStage === 'chat')
          ) && (
            <footer className="relative z-10 py-6 flex-shrink-0">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm text-slate-400">Powered by Gemini AI</p>
              </div>
            </footer>
          )}
        </div>
      )}
    </>
  );
};

export default Dashboard;