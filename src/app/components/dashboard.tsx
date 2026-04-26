'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadSection from './uploadSection';
import ChoiceCards from './choiceSection';
import AccessibilityChat from './AccessibilityChat';
import FeatureSelect from './FeatureSelect';
import MatchDesignForm from './MatchDesignForm';
import MatchDesignChat from './MatchDesignChat';
import DesignScanHistory from './DesignScanHistory';
import WebsiteRedesignerForm from './DesignSuggesterForm';
import WebsiteRedesignerResults from './DesignSuggesterResults';
import RedesignHistory, { type FullHistoryEntry } from './RedesignHistory';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/* ── Website Redesigner types ─────────────────────────────────────────── */
interface RedesignDesign {
  style: string;
  styleName: string;
  framework: string;
  frameworkLabel: string;
  ext: string;
  code: string;
  previewHtml?: string;
  previewType?: 'html' | 'sandpack';
}

export interface DesignHistoryEntry {
  id: string;
  prompt: string;
  design: RedesignDesign;
  isSaved: boolean;
  createdAt: number;
  websiteUrl?: string;
  dbId?: string;          // MongoDB _id — set after backend persists
}

interface DashboardProps {
  user?: { fullName: string; email: string; uid?: string; photoURL?: string | null };
  githubConnected?: boolean;
}

type AppStage = 'upload' | 'choice' | 'chat';
type Feature = 'accessibility' | 'match-design' | 'website-redesigner' | null;

const Dashboard: React.FC<DashboardProps> = ({ user, githubConnected = false }) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const mounted   = useRef(false);
  const urlSync   = useRef(false); // true while restoring from URL

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const [feature, setFeature] = useState<Feature>(null);

  /* ── Accessibility ───────────────────────────────────────────────────── */
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [accessibilityErrors, setAccessibilityErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<AppStage>('upload');
  const [selectedChoice, setSelectedChoice] = useState<'suggestions' | 'full-correction' | null>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [chatSessionId, setChatSessionId] = useState<string>('');

  /* ── Match Design ────────────────────────────────────────────────────── */
  const [matchStage, setMatchStage] = useState<'form' | 'history' | 'chat'>('form');
  const [matchProcessing, setMatchProcessing] = useState(false);
  const [matchMismatches, setMatchMismatches] = useState<any[]>([]);
  const [matchWebsiteUrl, setMatchWebsiteUrl] = useState('');
  const [matchFigmaUrl, setMatchFigmaUrl] = useState('');
  const [matchWebsiteScreenshot, setMatchWebsiteScreenshot] = useState('');
  const [matchFigmaScreenshot, setMatchFigmaScreenshot] = useState('');
  const [matchDiffImage, setMatchDiffImage] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [matchProjectedScore, setMatchProjectedScore] = useState(0);
  const [matchVerdict, setMatchVerdict] = useState('');
  const [matchVerdictDetail, setMatchVerdictDetail] = useState('');
  const [matchSectionScores, setMatchSectionScores] = useState<number[]>([]);
  const [matchWorstSection, setMatchWorstSection] = useState<any>(null);
  const [matchLayoutDivergence, setMatchLayoutDivergence] = useState(0);
  const [matchError, setMatchError] = useState<string | null>(null);

  /* ── Website Redesigner ──────────────────────────────────────────────── */
  const [redesignerStage, setRedesignerStage] = useState<'form' | 'history' | 'results'>('form');
  const [redesignerProcessing, setRedesignerProcessing] = useState(false);

  // Current session designs — ONLY the freshly generated ones
  const [currentSessionDesigns, setCurrentSessionDesigns] = useState<DesignHistoryEntry[]>([]);
  const [redesignHistoryKey, setRedesignHistoryKey] = useState(0);  // incremented to force refetch
  const [previousRedesignerStage, setPreviousRedesignerStage] = useState<'form' | 'history'>('form');

  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [redesignerWebsiteUrl, setRedesignerWebsiteUrl] = useState('');
  const [redesignerPageTitle, setRedesignerPageTitle] = useState('');
  const [redesignerScreenshot, setRedesignerScreenshot] = useState('');
  const [redesignerStats, setRedesignerStats] = useState<any>(null);
  const [redesignerStatus, setRedesignerStatus] = useState('');
  const [redesignerPendingStyles, setRedesignerPendingStyles] = useState<string[]>([]);


  /* ── URL navigation helpers ─────────────────────────────────────────── */
  // Build URL from feature + stage slug
  const buildUrl = (f: Feature, s?: string) =>
    f ? `/dashboard?f=${f}&s=${s || 'form'}` : '/dashboard';

  // Select a feature and push a new history entry so Back works
  const selectFeature = (f: Feature) => {
    window.history.pushState({}, '', buildUrl(f));
    setFeature(f);
  };

  // Restore state from URLSearchParams
  const restoreFromParams = (p: URLSearchParams) => {
    const f = (p.get('f') || null) as Feature;
    const s = p.get('s') || 'form';
    urlSync.current = true;
    setFeature(f);
    if (f === 'match-design') setMatchStage(s === 'results' ? 'chat' : (s as 'form' | 'history' | 'chat'));
    if (f === 'website-redesigner') setRedesignerStage(s as 'form' | 'history' | 'results');
    if (f === 'accessibility') setStage(s as AppStage);
    setTimeout(() => { urlSync.current = false; }, 100);
  };

  // On mount: restore state from URL
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    restoreFromParams(new URLSearchParams(window.location.search));
    mounted.current = true;
  }, []);

  // Keep URL in sync with state (replaceState = no extra history entries)
  useEffect(() => {
    if (!mounted.current || urlSync.current) return;
    const stageSlug =
      feature === 'match-design'        ? (matchStage === 'chat' ? 'results' : matchStage) :
      feature === 'website-redesigner'  ? redesignerStage :
      feature === 'accessibility'       ? stage : 'form';
    window.history.replaceState({}, '', buildUrl(feature, stageSlug));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, stage, matchStage, redesignerStage]);

  // Browser back/forward
  useEffect(() => {
    const onPop = () => restoreFromParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Full reset ──────────────────────────────────────────────────────── */
  const handleFullReset = () => {
    window.history.pushState({}, '', '/dashboard');
    setFeature(null);
    setUploadedFiles([]); setAccessibilityErrors([]); setIsProcessing(false);
    setSelectedChoice(null); setApiResult(null); setStage('upload');
    // Match Design: reset processing state but KEEP last scan results so they're
    // visible when the user returns to the feature via View History
    setMatchStage('form'); setMatchProcessing(false); setMatchError(null);
    // Redesigner: reset stage/processing but KEEP designHistory so saved designs persist
    setRedesignerStage('form'); setRedesignerProcessing(false);
    setRedesignerStatus(''); setRedesignerPendingStyles([]);
  };

  /* ── Accessibility handlers ──────────────────────────────────────────── */
  const handleFileUpload = (files: File[], errors?: any[]) => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const maxTotal = 500 * 1024 * 1024;
    const maxPerFile = 200 * 1024 * 1024;
    if (totalSize > maxTotal) { alert(`Total too large! Max 500MB. Yours: ${(totalSize / 1024 / 1024).toFixed(2)}MB`); return; }
    const oversized = files.filter(f => f.size > maxPerFile);
    if (oversized.length > 0) { alert(`Files too large (max 200MB each):\n${oversized.map(f => `- ${f.name}`).join('\n')}`); return; }
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
      const response = await api.postForm<any>('/api/accessibility/process', formData);
      if (choice === 'suggestions') {
        const allSuggestions = (response.results || [])
          .filter((r: any) => r.success && r.suggestions)
          .flatMap((r: any) => Array.isArray(r.suggestions) ? r.suggestions : [r.suggestions]);
        setApiResult(allSuggestions);
        if (response.sessionId) setChatSessionId(response.sessionId);
      } else {
        // direct-fix returns a download URL
        const blob = await fetch(response.downloadUrl || '').then(r => r.blob());
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `corrected-files-${Date.now()}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setApiResult([{ success: true, message: `Corrected ${uploadedFiles.length} file(s)` }]);
      }
      setStage('chat');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally { setIsProcessing(false); }
  };

  const handleAccessibilityReset = () => {
    setUploadedFiles([]); setAccessibilityErrors([]); setIsProcessing(false);
    setSelectedChoice(null); setApiResult(null); setStage('upload');
  };

  /* ── Match Design handlers ───────────────────────────────────────────── */
  const handleMatchSubmit = async (websiteUrl: string, figmaUrl: string) => {
    setMatchProcessing(true); setMatchWebsiteUrl(websiteUrl); setMatchFigmaUrl(figmaUrl); setMatchError(null);
    try {
      const data = await api.post<any>('/api/match-design', { websiteUrl, figmaUrl });
      setMatchMismatches(data.mismatches || []);
      setMatchWebsiteScreenshot(data.websiteScreenshotBase64 || data.websiteScreenshot || '');
      setMatchFigmaScreenshot(data.figmaScreenshotBase64 || data.figmaScreenshot || '');
      setMatchDiffImage(data.diffImageBase64 || '');
      setMatchScore(data.matchScore ?? data.currentScore ?? 0);
      setMatchProjectedScore(data.projectedScore ?? 100);
      setMatchVerdict(data.verdict || 'partial');
      setMatchVerdictDetail(data.verdictDetail || '');
      setMatchSectionScores(data.sectionScores || []);
      setMatchWorstSection(data.worstSection || null);
      setMatchLayoutDivergence(data.layoutDivergence || 0);
      setMatchStage('chat');
    } catch (error: any) {
      setMatchError(error.message || 'Comparison failed. Please try again.');
    } finally { setMatchProcessing(false); }
  };

  const handleMatchReset = () => {
    setMatchStage('form'); setMatchMismatches([]); setMatchWebsiteUrl(''); setMatchFigmaUrl('');
    setMatchWebsiteScreenshot(''); setMatchFigmaScreenshot('');
    setMatchDiffImage(''); setMatchScore(0); setMatchProjectedScore(0); setMatchError(null);
  };

  const handleMatchShowHistory = () => setMatchStage('history');

  // Load a previously saved scan from DB without re-running comparison
  const handleLoadScanFromHistory = async (scanId: string) => {
    try {
      const data = await api.get<any>(`/api/match-design/${scanId}`);
      const scan = data.scan;
      setMatchWebsiteUrl(scan.websiteUrl || '');
      setMatchFigmaUrl(scan.figmaUrl || '');
      setMatchMismatches(scan.mismatches || []);
      setMatchWebsiteScreenshot(scan.websiteScreenshotBase64 || '');
      setMatchFigmaScreenshot(scan.figmaScreenshotBase64 || '');
      setMatchDiffImage(scan.diffImageBase64 || '');
      setMatchScore(scan.matchScore ?? 0);
      setMatchProjectedScore(scan.projectedScore ?? 0);
      setMatchVerdict(scan.verdict || 'partial');
      setMatchVerdictDetail(scan.verdictDetail || '');
      setMatchSectionScores(scan.sectionScores || []);
      setMatchWorstSection(scan.worstSection || null);
      setMatchLayoutDivergence(scan.layoutDivergence || 0);
      setMatchStage('chat');
    } catch (err: any) {
      alert(`Could not load scan: ${err.message}`);
    }
  };

  /* ── Website Redesigner handlers ─────────────────────────────────────── */
  const handleRedesignerSubmit = async (
    websiteUrl: string,
    selectedPresets: string[],
    customPrompts: string[],
    framework?: string,
  ) => {
    // Build the full list of style keys we expect to receive (for skeleton cards)
    const customKeys = customPrompts
      .filter(p => p.trim().length > 5)
      .map((_, i) => `custom_${i + 1}`);
    const allPending = [...selectedPresets, ...customKeys];

    setRedesignerProcessing(true);
    setRedesignerWebsiteUrl(websiteUrl);
    // Clear current session designs for this new generation
    setCurrentSessionDesigns([]);
    setPreviousRedesignerStage('form');
    setRedesignerPendingStyles(allPending);
    setRedesignerStatus('Scraping site & generating redesigns…');

    try {
      const response = await api.postStream('/api/redesign', {
        websiteUrl, selectedStyles: selectedPresets, customPrompts, framework,
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstDesignReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          if (chunk.startsWith(': ping')) continue; // heartbeat

          const lines = chunk.split('\n');
          let eventName = '';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }
          if (!eventName || !dataStr) continue;

          try {
            const payload = JSON.parse(dataStr);

            if (eventName === 'status') {
              setRedesignerStatus(payload.message || '');

            } else if (eventName === 'meta') {
              setRedesignerPageTitle(payload.pageTitle || '');
              setRedesignerScreenshot(payload.screenshotBase64 || '');
              setRedesignerStats(payload.stats || null);

            } else if (eventName === 'design') {
              const arrivedStyle: string = payload.design?.style || '';
              const arrivedDesign: RedesignDesign = payload.design;
              const dbId: string | undefined = payload.design?.dbId;

              // Create a new history entry
              const entryId = crypto.randomUUID();
              const entry: DesignHistoryEntry = {
                id: entryId,
                prompt: `${arrivedDesign.styleName || arrivedStyle}`,
                design: arrivedDesign,
                isSaved: false,
                createdAt: Date.now(),
                websiteUrl,
                dbId,
              };

              setCurrentSessionDesigns(prev => [...prev, entry]);
              setRedesignerPendingStyles(prev => prev.filter(s => s !== arrivedStyle));

              // Switch to results and make first design active
              if (!firstDesignReceived) {
                firstDesignReceived = true;
                setActiveDesignId(entryId);
                setRedesignerStage('results');
                setRedesignerProcessing(false);
              }

            } else if (eventName === 'done') {
              setRedesignerPendingStyles([]);
              setRedesignerProcessing(false);
              setRedesignerStatus('');

            } else if (eventName === 'error') {
              throw new Error(payload.message || 'Stream error');
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (error: any) {
      if (error.message.includes('Not authenticated')) {
        setTimeout(() => { localStorage.clear(); window.location.href = '/signin'; }, 2000);
      }
      alert(`Error: ${error.message}`);
    } finally {
      setRedesignerProcessing(false);
      setRedesignerPendingStyles([]);
    }
  };

  const handleRedesignerReset = () => {
    setRedesignerStage('form');
    setCurrentSessionDesigns([]);
    setActiveDesignId(null);
    setRedesignerWebsiteUrl('');
    setRedesignerPageTitle('');
    setRedesignerScreenshot('');
    setRedesignerStats(null);
    setRedesignerPendingStyles([]);
  };

  // Load a saved design from history into the results view
  const handleViewHistoryDesign = (entry: FullHistoryEntry) => {
    const sessionEntry: DesignHistoryEntry = {
      id: entry._id,
      dbId: entry._id,
      prompt: entry.styleName || entry.style,
      design: {
        style: entry.style,
        styleName: entry.styleName,
        framework: entry.framework,
        frameworkLabel: entry.frameworkLabel,
        ext: entry.framework === 'react' || entry.framework === 'nextjs' ? 'jsx' : 'html',
        code: entry.previewHtml || '',
        previewHtml: entry.previewHtml || '',
      },
      isSaved: entry.isSaved,
      createdAt: new Date(entry.createdAt).getTime(),
      websiteUrl: entry.websiteUrl,
    };
    setCurrentSessionDesigns([sessionEntry]);
    setActiveDesignId(entry._id);
    setRedesignerWebsiteUrl(entry.websiteUrl);
    setPreviousRedesignerStage('history');
    setRedesignerStage('results');
  };

  const handleSelectDesign = (id: string) => setActiveDesignId(id);

  const handleToggleSave = async (id: string) => {
    const entry = currentSessionDesigns.find(e => e.id === id);
    const newSaved = entry ? !entry.isSaved : false;
    setCurrentSessionDesigns(prev =>
      prev.map(e => e.id === id ? { ...e, isSaved: newSaved } : e)
    );
    // Persist to DB if we have the dbId
    if (entry?.dbId) {
      try { await api.patch(`/api/redesign/${entry.dbId}/save`, {}); } catch { /* ignore */ }
    }
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const totalFiles = uploadedFiles.length;
  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const displayFileName = totalFiles === 1 ? uploadedFiles[0]?.name : `${totalFiles} file(s)`;

  const isInChat =
    (feature === 'accessibility' && stage === 'chat') ||
    (feature === 'match-design' && matchStage === 'chat');

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
      {feature === null && <FeatureSelect user={user} onSelect={selectFeature} />}

      {/* All feature screens */}
      {feature !== null && (
        <div className={`${isInChat ? 'h-screen' : 'min-h-screen'} bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden flex flex-col`}>

          {/* Loading overlay — only for accessibility and redesigner (NOT match-design — it handles its own pipeline animation) */}
          {anyProcessing && !(feature === 'match-design') && !(feature === 'website-redesigner' && redesignerStage === 'results') && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
                <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${feature === 'website-redesigner' ? 'border-indigo-500' : 'border-orange-500'
                  }`} />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {feature === 'website-redesigner' ? (redesignerStatus || 'Scraping content & generating redesigns…') :
                    `Processing ${totalFiles} file(s) with Gemini AI…`}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature === 'website-redesigner' ? 'Designs appear as they finish — first card coming up soon.' :
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
                    <span className={matchStage === 'history' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>History</span>
                    <span>›</span>
                    <span className={matchStage === 'chat' ? 'text-violet-600 font-semibold' : 'text-slate-400'}>Results</span>
                  </div>
                )}
                {feature === 'website-redesigner' && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span className={redesignerStage === 'form' ? 'text-indigo-600 font-semibold' : 'text-slate-400'}>URL</span>
                    <span>›</span>
                    <span className={redesignerStage === 'history' ? 'text-indigo-600 font-semibold' : 'text-slate-400'}>History</span>
                    <span>›</span>
                    <span className={redesignerStage === 'results' ? 'text-indigo-600 font-semibold' : 'text-slate-400'}>Redesigns</span>
                  </div>
                )}

                {/* GitHub connection indicator */}
                {!githubConnected && (
                  <button
                    onClick={() => router.push('/settings')}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                    Connect GitHub
                  </button>
                )}
                {githubConnected && (
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    GitHub connected
                  </div>
                )}

                <button onClick={handleFullReset}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:border-slate-400 transition-all bg-white/60">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Home
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  title="Settings"
                  className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:border-slate-400 transition-all bg-white/60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-600">{user?.email}</p>
                </div>
                <button onClick={handleLogout}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm">
                  Logout
                </button>
              </div>
            </div>
          </header>


          {/* Main */}
          <main className={`relative z-10 flex-1 min-h-0 ${isInChat ? 'overflow-hidden' : 'max-w-7xl mx-auto w-full px-6 py-12'}`}>

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                          <p>{totalFiles} files selected</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-orange-600 font-medium">View all</summary>
                            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
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
                      <div className="mt-4 pt-4 border-t border-orange-100 flex justify-between text-xs">
                        <span className="text-slate-600">Total: <span className="font-semibold">{totalFiles} file(s)</span></span>
                        <span className="text-slate-600">Size: <span className="font-semibold">{(totalSize / 1024 / 1024).toFixed(2)} MB</span></span>
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
                  <div style={{ height: '100%', overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px 0', gap: 8 }}>
                      {/* Resume last scan — visible if a scan was done earlier this session */}
                      {matchMismatches.length > 0 && (
                        <button
                          onClick={() => setMatchStage('chat')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Resume Last Scan ({matchScore}% match)
                        </button>
                      )}
                      <button
                        onClick={handleMatchShowHistory}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: 'inherit' }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        View History
                      </button>
                    </div>
                    <MatchDesignForm onSubmit={handleMatchSubmit} onBack={handleFullReset} isProcessing={matchProcessing} error={matchError} />
                  </div>
                )}
                {matchStage === 'history' && (
                  <div style={{ height: '100%', overflow: 'auto', padding: '24px', maxWidth: 640, margin: '0 auto' }}>
                    <DesignScanHistory
                      onLoadScan={handleLoadScanFromHistory}
                      onNewScan={() => setMatchStage('form')}
                    />
                  </div>
                )}
                {matchStage === 'chat' && (
                  <div className="animate-fade-in h-full">
                    <MatchDesignChat
                      mismatches={matchMismatches}
                      websiteUrl={matchWebsiteUrl}
                      figmaUrl={matchFigmaUrl}
                      websiteScreenshot={matchWebsiteScreenshot}
                      figmaScreenshot={matchFigmaScreenshot}
                      diffImageBase64={matchDiffImage}
                      matchScore={matchScore}
                      projectedScore={matchProjectedScore}
                      verdict={matchVerdict}
                      verdictDetail={matchVerdictDetail}
                      sectionScores={matchSectionScores}
                      worstSection={matchWorstSection}
                      layoutDivergence={matchLayoutDivergence}
                      onReset={handleMatchReset}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── Website Redesigner ── */}
            {feature === 'website-redesigner' && (
              <>
                {redesignerStage === 'form' && (
                  <div className="animate-slide-up">
                    <WebsiteRedesignerForm
                      onSubmit={handleRedesignerSubmit}
                      onBack={handleFullReset}
                      isProcessing={redesignerProcessing}
                      onShowHistory={() => { setRedesignHistoryKey(k => k + 1); setRedesignerStage('history'); }}
                    />
                  </div>
                )}
                {redesignerStage === 'history' && (
                  <div style={{ height: '100%', overflow: 'auto', padding: '24px', maxWidth: 640, margin: '0 auto' }}>
                    <RedesignHistory
                      key={redesignHistoryKey}
                      onViewDesign={handleViewHistoryDesign}
                      onNewRedesign={() => setRedesignerStage('form')}
                    />
                  </div>
                )}
                {redesignerStage === 'results' && (
                  <div className="animate-fade-in" style={{ height: '100%' }}>
                    <WebsiteRedesignerResults
                      designHistory={currentSessionDesigns}
                      activeDesignId={activeDesignId}
                      websiteUrl={redesignerWebsiteUrl}
                      pageTitle={redesignerPageTitle}
                      screenshotBase64={redesignerScreenshot}
                      stats={redesignerStats}
                      onReset={() => setRedesignerStage(previousRedesignerStage)}
                      isStreaming={redesignerProcessing}
                      pendingStyles={redesignerPendingStyles}
                      onSelectDesign={handleSelectDesign}
                      onToggleSave={handleToggleSave}
                      githubConnected={githubConnected}
                      onConnectGitHub={() => router.push('/settings')}
                    />
                  </div>
                )}
              </>
            )}

          </main>

        </div>
      )}
    </>
  );
};

export default Dashboard;