'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getExtensionErrors, isExtensionAvailable, AccessibilityError } from './extensionBridge';

interface UploadSectionProps {
  onFileUpload: (files: File[], errors?: AccessibilityError[]) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging]           = useState(false);
  const [selectedFiles, setSelectedFiles]     = useState<File[]>([]);
  const [extensionErrors, setExtensionErrors] = useState<AccessibilityError[]>([]);
  const [extAvailable, setExtAvailable]       = useState<boolean | null>(null); // null = checking
  const [extLoading, setExtLoading]           = useState(false);
  const [extImported, setExtImported]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Check if extension is reachable on mount ──────────────────────────────
  useEffect(() => {
    isExtensionAvailable().then(available => {
      setExtAvailable(available);
      console.log('[UploadSection] Extension available:', available);
    });
  }, []);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const handleFiles = (files: File[]) => {
    const valid = files.filter(isValidFile);
    if (valid.length === 0) { alert('Please upload valid code files or zip archives'); return; }
    if (valid.length !== files.length) {
      alert(`${files.length - valid.length} file(s) were rejected (invalid type)`);
    }
    setSelectedFiles(valid);
  };

  const isValidFile = (file: File) =>
    ['.js','.jsx','.ts','.tsx','.py','.java','.cpp','.c','.cs',
     '.php','.rb','.go','.rs','.swift','.kt','.html','.css',
     '.json','.xml','.sql','.sh','.zip','.rar','.7z','.tar','.gz']
    .some(ext => file.name.toLowerCase().endsWith(ext));

  // ── Pull errors from Chrome extension ────────────────────────────────────
  const handleImportExtensionErrors = async () => {
    setExtLoading(true);
    try {
      const errors = await getExtensionErrors();
      if (errors.length === 0) {
        alert('No accessibility errors found in the extension.\n\nMake sure you have scanned a page with the Flow Finder extension first.');
        return;
      }
      setExtensionErrors(errors);
      setExtImported(true);
      console.log(`[UploadSection] Imported ${errors.length} errors from extension`);
    } catch (err) {
      console.error('[UploadSection] Failed to import extension errors:', err);
      alert('Could not reach the Flow Finder extension. Make sure it is installed and active.');
    } finally {
      setExtLoading(false);
    }
  };

  // ── Continue to next step ─────────────────────────────────────────────────
  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles, extensionErrors.length > 0 ? extensionErrors : undefined);
    }
  };

  const handleRemoveFile = (index: number) =>
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);

  return (
    <>
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(249,115,22,0.3); }
          50%       { border-color: rgba(249,115,22,0.6); }
        }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-5xl font-black mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em' }}
          >
            Upload Your Code
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Drop multiple code files or zip archives here to get AI-powered accessibility fixes
          </p>
        </div>

        {/* ── Extension Error Import Banner ─────────────────────────────────── */}
        <div className={`mb-6 rounded-2xl border-2 p-5 transition-all duration-300 ${
          extImported
            ? 'bg-green-50 border-green-400'
            : extAvailable === false
              ? 'bg-slate-50 border-slate-200 opacity-60'
              : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                extImported ? 'bg-green-500' : 'bg-gradient-to-br from-orange-500 to-amber-600'
              }`}>
                {extImported ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                )}
              </div>

              <div>
                {extImported ? (
                  <>
                    <p className="font-bold text-green-800 text-sm flex items-center gap-1.5">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      {extensionErrors.length} accessibility errors imported from extension
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      These will be used to guide the AI correction of your uploaded files.
                    </p>
                  </>
                ) : extAvailable === false ? (
                  <>
                    <p className="font-bold text-slate-600 text-sm">Flow Finder Extension not detected</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Install the extension and scan a page first, or upload files without errors.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-orange-800 text-sm">Import errors from Flow Finder Extension</p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Automatically pull accessibility errors scanned on any tab.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {extImported && (
                <button
                  onClick={() => { setExtensionErrors([]); setExtImported(false); }}
                  className="text-xs text-green-700 underline hover:text-green-900"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleImportExtensionErrors}
                disabled={extAvailable === false || extLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm ${
                  extAvailable === false
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : extImported
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {extLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Importing…
                  </>
                ) : extImported ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Re-import
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Import Errors
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error preview pills */}
          {extImported && extensionErrors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-2">Error types detected:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(extensionErrors.map(e => e.type || e.impact || 'unknown')))
                  .slice(0, 8)
                  .map((type, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-green-300 text-green-700 text-xs rounded-full font-medium">
                      {type}
                    </span>
                  ))}
                {extensionErrors.length > 8 && (
                  <span className="px-2.5 py-1 bg-white border border-green-300 text-green-700 text-xs rounded-full font-medium">
                    +{extensionErrors.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── File Drop Zone ────────────────────────────────────────────────── */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-4 border-dashed rounded-3xl p-12 transition-all duration-300
            ${isDragging
              ? 'border-orange-500 bg-orange-50/50 scale-[1.02]'
              : selectedFiles.length > 0
                ? 'border-green-500 bg-green-50/50'
                : 'border-orange-200 bg-white/60 hover:border-orange-400 hover:bg-orange-50/30'
            }
            backdrop-blur-sm shadow-xl
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.html,.css,.json,.xml,.sql,.sh,.zip,.rar,.7z,.tar,.gz"
            multiple
          />

          {selectedFiles.length === 0 ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                {isDragging ? 'Drop them here!' : 'Drag & Drop Your Files'}
              </h3>
              <p className="text-slate-600 mb-2">or click to browse from your computer</p>
              <p className="text-sm text-orange-600 font-semibold mb-6 flex items-center justify-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z"/></svg>
                You can select multiple files at once
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Choose Files
              </button>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Supported formats:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['JavaScript','TypeScript','Python','Java','C++','HTML','CSS','ZIP Archives'].map(f => (
                    <span key={f} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} Selected!
              </h3>

              <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="inline-flex items-center space-x-3 px-4 py-3 bg-white rounded-xl shadow-md border border-slate-200 max-w-md">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveFile(index); }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span className="text-sm font-semibold text-blue-700">Total: {formatFileSize(totalSize)}</span>
              </div>

              <div className="flex justify-center space-x-4">
                <button onClick={() => setSelectedFiles([])} className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-300">
                  Clear All
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all duration-300">
                  Add More Files
                </button>
                <button
                  onClick={handleUpload}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}
        </div>        
      </div>
    </>
  );
};

export default UploadSection;