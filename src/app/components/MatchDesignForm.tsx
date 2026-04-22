'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onSubmit: (websiteUrl: string, figmaUrl: string) => void;
  onBack: () => void;
  isProcessing: boolean;
  error?: string | null;
}

const STAGES = [
  { id: 'figma',      label: 'Ingesting Figma design', sub: 'Extracting frame dimensions & node tree' },
  { id: 'screenshot', label: 'Capturing live site', sub: 'Viewport synced to Figma frame size' },
  { id: 'spatial',    label: 'Spatial matching (IoU)', sub: 'Matching elements by position & text' },
  { id: 'diffing',    label: 'Property diffing engine', sub: 'Comparing colors, fonts, spacing, borders' },
  { id: 'complete',   label: 'Building drift report', sub: 'VLM fallback + final analysis' },
];

// Durations for stages 0-3 (ms). Stage 4 stays active until isProcessing becomes false.
const STAGE_DURATIONS = [18000, 12000, 20000, 12000];

const MatchDesignForm: React.FC<Props> = ({ onSubmit, onBack, isProcessing, error }) => {
  const [websiteUrl, setWebsiteUrl]   = useState('');
  const [figmaUrl, setFigmaUrl]       = useState('');
  const [errors, setErrors]           = useState<{ website?: string; figma?: string }>({});
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [done, setDone]               = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (!isProcessing) {
      // Small "done" flash before parent unmounts the pipeline
      if (activeStage > 0) {
        setDone(true);
        const t = setTimeout(() => { setDone(false); setActiveStage(0); setCompletedStages([]); }, 800);
        timerRefs.current.push(t);
      }
      return;
    }
    setDone(false);
    let cumulative = 0;
    STAGE_DURATIONS.forEach((dur, idx) => {
      const t = setTimeout(() => {
        setActiveStage(idx);
        setCompletedStages(prev => (idx > 0 ? [...prev, idx - 1] : prev));
      }, cumulative);
      timerRefs.current.push(t);
      cumulative += dur;
    });
    // Advance to last stage after all timed stages complete
    const last = setTimeout(() => {
      setActiveStage(STAGES.length - 1);
      setCompletedStages([0, 1, 2, 3]);
    }, cumulative);
    timerRefs.current.push(last);
    return () => timerRefs.current.forEach(clearTimeout);
  }, [isProcessing]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e: { website?: string; figma?: string } = {};
    if (!websiteUrl.startsWith('http')) e.website = 'Enter a valid URL starting with https://';
    if (!figmaUrl.includes('figma.com')) e.figma = 'Enter a valid figma.com share link';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(websiteUrl.trim(), figmaUrl.trim()); };

  const progressPct = Math.round(
    ((completedStages.length + (activeStage === STAGES.length - 1 && !done ? 0.7 : 0)) / STAGES.length) * 100
  );

  /* ── Shared inline styles ── */
  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '20px 22px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '9px 12px',
    background: hasError ? '#fef2f2' : '#f8fafc',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: 8, color: '#0f172a',
    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px 24px', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#6366f1,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Match Design
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Spatial comparison using IoU matching between your live site and Figma design
          </p>
        </div>

        {isProcessing ? (
          /* ── Progress Pipeline ── */
          <div style={{ ...card, animation: done ? 'none' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {done ? 'Analysis complete' : 'Analysing designs'}
              </p>
              {done && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STAGES.map((stage, idx) => {
                const isDone   = completedStages.includes(idx) || done;
                const isActive = !done && activeStage === idx;
                const isLast   = idx === STAGES.length - 1;
                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? '#22c55e' : isActive ? '#6366f1' : '#f1f5f9',
                        border: `2px solid ${isDone ? '#22c55e' : isActive ? '#6366f1' : '#e2e8f0'}`,
                        color: isDone || isActive ? '#fff' : '#94a3b8',
                        transition: 'all .4s ease',
                        boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
                      }}>
                        {isDone ? (
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isActive && isLast ? (
                          /* Spinner for elastic last stage */
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        ) : isActive ? (
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'block', animation: 'pulse 1s infinite' }} />
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>
                        )}
                      </div>
                      {idx < STAGES.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 16, background: isDone ? '#22c55e' : '#e2e8f0', margin: '3px 0', transition: 'background .4s ease' }} />
                      )}
                    </div>
                    <div style={{ paddingLeft: 12, paddingBottom: idx < STAGES.length - 1 ? 16 : 0, paddingTop: 3, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isDone ? '#22c55e' : isActive ? '#6366f1' : '#94a3b8', transition: 'color .3s ease' }}>
                        {stage.label}
                        {isDone && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500 }}>Done</span>}
                        {isActive && isLast && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>Finishing up…</span>}
                      </p>
                      {(isActive || isDone) && (
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748b' }}>{stage.sub}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 20, height: 3, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg,#6366f1,#818cf8)',
                width: `${progressPct}%`,
                transition: 'width 1.5s ease',
              }} />
            </div>
            <p style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
              This takes 30–90 seconds — please keep this tab open
            </p>
          </div>
        ) : (
          /* ── Input Form ── */
          <div style={card}>

            {/* Website URL */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Live Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => { setWebsiteUrl(e.target.value); setErrors(p => ({ ...p, website: undefined })); }}
                placeholder="https://yourwebsite.com"
                style={inputStyle(!!errors.website)}
              />
              {errors.website && (
                <p style={{ marginTop: 4, fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errors.website}
                </p>
              )}
            </div>

            {/* Figma URL */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Figma Design URL</label>
              <input
                type="url"
                value={figmaUrl}
                onChange={e => { setFigmaUrl(e.target.value); setErrors(p => ({ ...p, figma: undefined })); }}
                placeholder="https://www.figma.com/design/..."
                style={inputStyle(!!errors.figma)}
              />
              {errors.figma ? (
                <p style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{errors.figma}</p>
              ) : (
                <p style={{ marginTop: 4, fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                  Set Figma file to "Anyone with the link can view"
                </p>
              )}
            </div>

            {/* How it works */}
            <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, margin: '0 0 6px' }}>
                How it works
              </p>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                {['Ingest Figma', 'Sync viewport', 'IoU match', 'Property diff', 'Drift report'].map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, background: '#ede9fe', padding: '2px 7px', borderRadius: 99 }}>{step}</span>
                    {i < 4 && <span style={{ color: '#94a3b8', fontSize: 10 }}>›</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* API error */}
            {error && (
              <div style={{ marginBottom: 14, padding: '10px 12px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <svg width="14" height="14" fill="none" stroke="#dc2626" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ margin: 0, fontSize: 12, color: '#dc2626', lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onBack}
                style={{ padding: '9px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: 'inherit' }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!websiteUrl || !figmaUrl}
                style={{
                  flex: 1, padding: '9px 16px',
                  background: !websiteUrl || !figmaUrl ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#818cf8)',
                  border: 'none', borderRadius: 8,
                  cursor: !websiteUrl || !figmaUrl ? 'not-allowed' : 'pointer',
                  color: !websiteUrl || !figmaUrl ? '#94a3b8' : '#fff',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: !websiteUrl || !figmaUrl ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
                  transition: 'all .15s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Designs
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
};

export default MatchDesignForm;