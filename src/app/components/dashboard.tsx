'use client';

import React, { useState } from 'react';
import UploadSection from './uploadSection';
import ChoiceCards from './choiceSection';
import AccessibilityChat from './AccessibilityChat';

interface DashboardProps {
  user?: {
    fullName: string;
    email: string;
  };
}

type AppStage = 'upload' | 'choice' | 'chat';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null);
  const [accessibilityErrors, setAccessibilityErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [stage, setStage]                       = useState<AppStage>('upload');

  // choice the user made — passed into chat so it auto-triggers
  const [selectedChoice, setSelectedChoice]     = useState<'suggestions' | 'full-correction' | null>(null);
  // results that come back from the API
  const [apiResult, setApiResult]               = useState<any>(null);

  /* ── Step 1: file uploaded ────────────────────────────────────────────── */
  const handleFileUpload = (file: File, errors?: any[]) => {
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File is too large! Maximum size is 200MB.`);
      return;
    }
    setUploadedFile(file);
    setAccessibilityErrors(errors || []);
    setStage('choice');
  };

  /* ── Step 2: user picked a choice → call API → go to chat ────────────── */
  const handleChoiceSelect = async (choice: 'suggestions' | 'full-correction') => {
    if (!uploadedFile) return;

    setSelectedChoice(choice);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
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
        // data.suggestions is an array — pass it to chat
        setApiResult(data.suggestions);
      } else {
        // full-correction returns a ZIP blob — trigger download
        const blob = await response.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `corrected-${uploadedFile.name}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // also show corrections in chat (use accessibility errors as fallback display)
        setApiResult(accessibilityErrors);
      }

      // Switch to chat view — results are ready
      setStage('chat');

    } catch (error: any) {
      console.error('Processing error:', error);
      let msg = error.message;
      if (msg.includes('Not authenticated')) {
        setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000);
      }
      alert(`❌ Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Reset everything ─────────────────────────────────────────────────── */
  const handleReset = () => {
    setUploadedFile(null);
    setAccessibilityErrors([]);
    setIsProcessing(false);
    setSelectedChoice(null);
    setApiResult(null);
    setStage('upload');
  };

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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden flex flex-col">

        {/* Loading overlay — only while API call is in flight */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Processing with AI...</h3>
              <p className="text-sm text-slate-600">Analyzing and fixing your code. This may take a moment.</p>
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
              <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent" style={{ fontFamily: '"Playfair Display", serif' }}>
                Flow Finder
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Breadcrumb trail */}
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <span className={stage === 'upload' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Upload</span>
                <span>›</span>
                <span className={stage === 'choice' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Choose</span>
                <span>›</span>
                <span className={stage === 'chat' ? 'text-orange-600 font-semibold' : 'text-slate-400'}>Results</span>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
                <p className="text-xs text-slate-600">{user?.email}</p>
              </div>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/signin'; }}
                className="px-4 py-2 bg-white/80 hover:bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`relative z-10 flex-1 ${stage === 'chat' ? '' : 'max-w-7xl mx-auto w-full px-6 py-12'}`}>

          {stage === 'upload' && (
            <div className="animate-slide-up">
              <UploadSection onFileUpload={handleFileUpload} />
            </div>
          )}

          {stage === 'choice' && (
            <div className="animate-fade-in">
              <ChoiceCards
                fileName={uploadedFile?.name || ''}
                onChoiceSelect={handleChoiceSelect}
                onReset={handleReset}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {stage === 'chat' && (
            <div className="animate-fade-in h-full">
              <AccessibilityChat
                errors={apiResult}
                fileName={uploadedFile?.name}
                initialChoice={selectedChoice!}
                onReset={handleReset}
              />
            </div>
          )}

        </main>

        {/* Footer — hidden in chat stage so chat can use full height */}
        {stage !== 'chat' && (
          <footer className="relative z-10 py-6 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-sm text-slate-600">Made with ❤️ by Flow Finder Team • Powered by Gemini AI</p>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};

export default Dashboard;