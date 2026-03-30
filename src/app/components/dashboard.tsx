'use client';

import React, { useState } from 'react';
import UploadSection from './uploadSection';
import ChoiceCards from './choiceSection';
import AccessibilityChat from './AccessibilityChat';
import FeatureSelect from './FeatureSelect';
import MatchDesignForm from './MatchDesignForm';
import MatchDesignChat from './MatchDesignChat';
import WebsiteRedesignerForm from './DesignSuggesterForm';
import WebsiteRedesignerResults from './DesignSuggesterResults';

interface DashboardProps {
  user?: { fullName: string; email: string };
}

type AppStage = 'upload' | 'choice' | 'chat';
type Feature  = 'accessibility' | 'match-design' | 'website-redesigner' | null;

const Dashboard: React.FC<DashboardProps> = ({ user }) => {

  const [feature, setFeature] = useState<Feature>(null);

  /* ── Accessibility ───────────────────────────────────────────────────── */
  const [uploadedFiles, setUploadedFiles]             = useState<File[]>([]);
  const [accessibilityErrors, setAccessibilityErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing]               = useState(false);
  const [stage, setStage]                             = useState<AppStage>('upload');
  const [selectedChoice, setSelectedChoice]           = useState<'suggestions' | 'full-correction' | null>(null);
  const [apiResult, setApiResult]                     = useState<any>(null);
  const [chatSessionId, setChatSessionId]             = useState<string>('');

  /* ── Match Design ────────────────────────────────────────────────────── */
  const [matchStage, setMatchStage]           = useState<'form' | 'chat'>('form');
  const [matchProcessing, setMatchProcessing] = useState(false);
  const [matchMismatches, setMatchMismatches] = useState<any[]>([]);
  const [matchWebsiteUrl, setMatchWebsiteUrl] = useState('');
  const [matchFigmaUrl, setMatchFigmaUrl]     = useState('');

  /* ── Website Redesigner ──────────────────────────────────────────────── */
  const [redesignerStage, setRedesignerStage]           = useState<'form' | 'results'>('form');
  const [redesignerProcessing, setRedesignerProcessing] = useState(false);
  const [redesignerDesigns, setRedesignerDesigns]       = useState<any[]>([]);
  const [redesignerWebsiteUrl, setRedesignerWebsiteUrl] = useState('');
  const [redesignerPageTitle, setRedesignerPageTitle]   = useState('');
  const [redesignerScreenshot, setRedesignerScreenshot] = useState('');

  /* ── Full reset ──────────────────────────────────────────────────────── */
  const handleFullReset = () => {
    setFeature(null);
    setUploadedFiles([]); setAccessibilityErrors([]); setIsProcessing(false);
    setSelectedChoice(null); setApiResult(null); setStage('upload');
    setMatchStage('form'); setMatchProcessing(false); setMatchMismatches([]);
    setMatchWebsiteUrl(''); setMatchFigmaUrl('');
    setRedesignerStage('form'); setRedesignerProcessing(false); setRedesignerDesigns([]);
    setRedesignerWebsiteUrl(''); setRedesignerPageTitle(''); setRedesignerScreenshot('');
  };

  /* ── Accessibility handlers ──────────────────────────────────────────── */
  const handleFileUpload = (files: File[], errors?: any[]) => {
    const totalSize  = files.reduce((sum, f) => sum + f.size, 0);
    const maxTotal   = 500 * 1024 * 1024;
    const maxPerFile = 200 * 1024 * 1024;
    if (totalSize > maxTotal) { alert(`Total too large! Max 500MB. Yours: ${(totalSize/1024/1024).toFixed(2)}MB`); return; }
    const oversized = files.filter(f => f.size > maxPerFile);
    if (oversized.length > 0) { alert(`Files too large (max 200MB each):\n${oversized.map(f=>`- ${f.name}`).join('\n')}`); return; }
    setUploadedFiles(files);
    setAccessibilityErrors(errors || []);
    setStage('choice');
  };

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
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Processing failed'); }
      if (choice === 'suggestions') {
        const data = await response.json();
        console.log('FULL API RESPONSE:', JSON.stringify(data, null, 2)); // ADD THIS
        console.log('SESSION ID:', data.sessionId); // ADD THIS
        const allSuggestions = data.results
          .filter((r: any) => r.success && r.suggestions)
          .flatMap((r: any) => Array.isArray(r.suggestions) ? r.suggestions : [r.suggestions]);
        setApiResult(allSuggestions);
        if (data.sessionId) setChatSessionId(data.sessionId);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `corrected-files-${Date.now()}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setApiResult([{ success: true, message: `Corrected ${uploadedFiles.length} file(s)` }]);
      }
      setStage('chat');
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('Not authenticated')) { setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000); }
      alert(`❌ Error: ${msg}`);
    } finally { setIsProcessing(false); }
  };

  const handleAccessibilityReset = () => {
    setUploadedFiles([]); setAccessibilityErrors([]); setIsProcessing(false);
    setSelectedChoice(null); setApiResult(null); setStage('upload');
  };

  /* ── Match Design handlers ───────────────────────────────────────────── */
  const handleMatchSubmit = async (websiteUrl: string, figmaUrl: string) => {
    setMatchProcessing(true); setMatchWebsiteUrl(websiteUrl); setMatchFigmaUrl(figmaUrl);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated. Please login again.');
      const response = await fetch('http://localhost:5000/api/match-design', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl, figmaUrl }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Comparison failed'); }
      const data = await response.json();
      setMatchMismatches(data.mismatches || []);
      setMatchStage('chat');
    } catch (error: any) {
      if (error.message.includes('Not authenticated')) { setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000); }
      alert(`❌ Error: ${error.message}`);
    } finally { setMatchProcessing(false); }
  };

  const handleMatchReset = () => {
    setMatchStage('form'); setMatchMismatches([]); setMatchWebsiteUrl(''); setMatchFigmaUrl('');
  };

  /* ── Website Redesigner handlers ─────────────────────────────────────── */
  const handleRedesignerSubmit = async (websiteUrl: string) => {
    setRedesignerProcessing(true); setRedesignerWebsiteUrl(websiteUrl);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated. Please login again.');
      const response = await fetch('http://localhost:5000/api/redesign', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Redesign failed'); }
      const data = await response.json();
      setRedesignerDesigns(data.designs || []);
      setRedesignerPageTitle(data.pageTitle || '');
      setRedesignerScreenshot(data.screenshotBase64 || '');
      setRedesignerStage('results');
    } catch (error: any) {
      if (error.message.includes('Not authenticated')) { setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000); }
      alert(`❌ Error: ${error.message}`);
    } finally { setRedesignerProcessing(false); }
  };

  const handleRedesignerReset = () => {
    setRedesignerStage('form'); setRedesignerDesigns([]);
    setRedesignerWebsiteUrl(''); setRedesignerPageTitle(''); setRedesignerScreenshot('');
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const totalFiles      = uploadedFiles.length;
  const totalSize       = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const displayFileName = totalFiles === 1 ? uploadedFiles[0]?.name : `${totalFiles} file(s)`;

  const isInChat =
    (feature === 'accessibility'    && stage === 'chat') ||
    (feature === 'match-design'     && matchStage === 'chat');

  const anyProcessing = isProcessing || matchProcessing || redesignerProcessing;

  return (
    <>
      <style jsx>{`
        @keyframes float    { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(5deg)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        .animate-float    { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
        .animate-fade-in  { animation: fadeIn 0.4s ease-out forwards; }
        .glass-effect { background:rgba(255,255,255,0.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }
      `}</style>

      {/* Feature Select */}
      {feature === null && <FeatureSelect user={user} onSelect={setFeature} />}

      {/* All feature screens */}
      {feature !== null && (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden flex flex-col">

          {/* Loading overlay */}
          {anyProcessing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
                <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
                  feature === 'match-design' ? 'border-violet-500' :
                  feature === 'website-redesigner' ? 'border-indigo-500' : 'border-orange-500'
                }`} />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {feature === 'match-design'       ? 'Comparing designs with Gemini Vision…' :
                   feature === 'website-redesigner' ? 'Scraping content & generating 3 redesigns…' :
                   `Processing ${totalFiles} file(s) with Gemini AI…`}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature === 'match-design'       ? 'Screenshotting site, fetching Figma, running comparison. ~30s.' :
                   feature === 'website-redesigner' ? 'Generating 3 full HTML pages. Please wait ~60s.' :
                   `Analyzing your code. This may take ${totalFiles > 5 ? 'a few minutes' : 'a moment'}.`}
                </p>
              </div>
            </div>
          )}

          {/* Blobs */}
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
                <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Flow Finder
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* Breadcrumbs */}
                {feature === 'accessibility' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={stage === 'upload' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Upload</span>
                    <span>›</span>
                    <span className={stage === 'choice' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Choose</span>
                    <span>›</span>
                    <span className={stage === 'chat' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Results</span>
                  </div>
                )}
                {feature === 'match-design' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={matchStage === 'form' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>URLs</span>
                    <span>›</span>
                    <span className={matchStage === 'chat' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>Results</span>
                  </div>
                )}
                {feature === 'website-redesigner' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={redesignerStage === 'form' ? 'text-indigo-600 font-semibold' : 'text-slate-400'}>URL</span>
                    <span>›</span>
                    <span className={redesignerStage === 'results' ? 'text-indigo-600 font-semibold' : 'text-slate-400'}>Redesigns</span>
                  </div>
                )}

                <button onClick={handleFullReset}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:border-slate-400 transition-all bg-white/60">
                  ← Home
                </button>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-600">{user?.email}</p>
                </div>
                <button onClick={() => { localStorage.clear(); window.location.href = '/signin'; }}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm">
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className={`relative z-10 flex-1 ${isInChat ? '' : 'max-w-7xl mx-auto w-full px-6 py-12'}`}>

            {/* ── Accessibility ── */}
            {feature === 'accessibility' && (
              <>
                {stage === 'upload' && (
                  <div className="animate-slide-up"><UploadSection onFileUpload={handleFileUpload} /></div>
                )}
                {stage === 'choice' && (
                  <div className="animate-fade-in">
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
                              <span className="text-xs text-slate-500">{(file.size/1024).toFixed(1)} KB</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-700">
                          <p>{totalFiles} files selected</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-orange-600 font-medium">View all</summary>
                            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                              {uploadedFiles.map((file, idx) => (
                                <li key={idx} className="text-xs text-slate-600 flex justify-between">
                                  <span className="truncate">{idx+1}. {file.name}</span>
                                  <span className="ml-2">{(file.size/1024).toFixed(1)} KB</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-orange-100 flex justify-between text-xs">
                        <span className="text-slate-600">Total: <span className="font-semibold">{totalFiles} file(s)</span></span>
                        <span className="text-slate-600">Size: <span className="font-semibold">{(totalSize/1024/1024).toFixed(2)} MB</span></span>
                      </div>
                    </div>
                    <ChoiceCards fileName={displayFileName} onChoiceSelect={handleChoiceSelect} onReset={handleAccessibilityReset} isProcessing={isProcessing} />
                  </div>
                )}
                {stage === 'chat' && (
                  <div className="animate-fade-in h-full">
                    <AccessibilityChat errors={apiResult} fileName={displayFileName} initialChoice={selectedChoice!} onReset={handleAccessibilityReset} sessionId={chatSessionId} />
                  </div>
                )}
              </>
            )}

            {/* ── Match Design ── */}
            {feature === 'match-design' && (
              <>
                {matchStage === 'form' && (
                  <div className="animate-slide-up">
                    <MatchDesignForm onSubmit={handleMatchSubmit} onBack={handleFullReset} isProcessing={matchProcessing} />
                  </div>
                )}
                {matchStage === 'chat' && (
                  <div className="animate-fade-in h-full">
                    <MatchDesignChat mismatches={matchMismatches} websiteUrl={matchWebsiteUrl} figmaUrl={matchFigmaUrl} onReset={handleMatchReset} />
                  </div>
                )}
              </>
            )}

            {/* ── Website Redesigner ── */}
            {feature === 'website-redesigner' && (
              <>
                {redesignerStage === 'form' && (
                  <div className="animate-slide-up">
                    <WebsiteRedesignerForm onSubmit={handleRedesignerSubmit} onBack={handleFullReset} isProcessing={redesignerProcessing} />
                  </div>
                )}
                {redesignerStage === 'results' && (
                  <div className="animate-fade-in">
                    <WebsiteRedesignerResults designs={redesignerDesigns} websiteUrl={redesignerWebsiteUrl} pageTitle={redesignerPageTitle} screenshotBase64={redesignerScreenshot} onReset={handleRedesignerReset} />
                  </div>
                )}
              </>
            )}

          </main>

          {/* Footer */}
          {!isInChat && (
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