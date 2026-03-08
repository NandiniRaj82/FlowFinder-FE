'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ── Normalize errors coming from the extension ───────────────────────────
   Extension errors have: { title, impact, source, selector, pages, count }
   Gemini errors have:    { errorType, severity, explanation, codeExample, wcagReference }
── */
const normalizeError = (err: any, index: number) => ({
  errorNumber:   err.errorNumber  ?? index + 1,
  errorType:     err.errorType    ?? err.title ?? err.id ?? 'Accessibility Issue',
  severity:      err.severity     ?? err.impact ?? 'low',
  explanation:   err.explanation  ?? err.description ?? err.help ?? '',
  codeExample:   err.codeExample  ?? null,
  wcagReference: err.wcagReference ?? (err.tags ? err.tags.filter((t: string) => t.startsWith('wcag')).join(', ') : ''),
  source:        err.source       ?? null,
  pages:         err.pages        ?? null,
});

/* ── Impact/severity color map ───────────────────────────────────────────── */
const IMPACT_STYLES: Record<string, { pill: string; dot: string }> = {
  critical: { pill: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
  serious:  { pill: "bg-red-100 text-red-700",       dot: "bg-red-400"    },
  high:     { pill: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  moderate: { pill: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  minor:    { pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-400"   },
  low:      { pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   },
};

/* ── Source badge (lighthouse vs axe) ───────────────────────────────────── */
const SourceBadge = ({ source }: { source: string | null }) => {
  if (!source) return null;
  const isLighthouse = source === 'lighthouse';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      isLighthouse ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
    }`}>
      {isLighthouse ? '🔦 Lighthouse' : '🪓 Axe'}
    </span>
  );
};

/* ── Impact badge ────────────────────────────────────────────────────────── */
const ImpactBadge = ({ severity }: { severity: string }) => {
  const safe = (severity || 'low').toLowerCase();
  const s = IMPACT_STYLES[safe] || IMPACT_STYLES.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {safe.charAt(0).toUpperCase() + safe.slice(1)}
    </span>
  );
};

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">code</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied
            ? <><svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><span className="text-green-400">Copied!</span></>
            : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy</>
          }
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  );
};

const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  </div>
);

const TypingDots = () => (
  <div className="flex items-start gap-3">
    <BotAvatar />
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-orange-400"
            style={{ animation: `dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Message types ───────────────────────────────────────────────────────── */
interface Msg {
  id: string | number;
  role: 'user' | 'assistant';
  content?: string;
  text?: string;
  suggestions?: any[];
  corrections?: any[];
}

/* ── Message renderer ────────────────────────────────────────────────────── */
const ChatMessage = ({ msg }: { msg: Msg }) => {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end" style={{ animation: 'slideInUp 0.3s ease-out both' }}>
        <div className="max-w-xs bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3" style={{ animation: 'slideInUp 0.3s ease-out both' }}>
      <BotAvatar />
      <div className="flex-1 min-w-0 space-y-3">

        {msg.text && (
          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm inline-block max-w-lg">
            <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
          </div>
        )}

        {/* Suggestion cards */}
        {msg.suggestions && (
          <div className="space-y-3">
            {msg.suggestions.map((err, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                style={{ animation: `slideInUp 0.35s ease-out ${i * 0.07}s both` }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {err.errorNumber}
                      </span>
                      <h3 className="font-semibold text-slate-800 text-sm leading-tight">{err.errorType}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <SourceBadge source={err.source} />
                      <ImpactBadge severity={err.severity} />
                    </div>
                  </div>
                  {err.explanation && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{err.explanation}</p>
                  )}
                  {err.wcagReference && (
                    <p className="text-xs font-medium text-orange-600">{err.wcagReference}</p>
                  )}
                  {err.pages && err.pages.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Found on: {err.pages.map((p: string) => { try { return new URL(p).pathname || '/'; } catch { return p; } }).join(', ')}
                    </p>
                  )}
                  {err.codeExample && <CodeBlock code={err.codeExample} />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Correction panel */}
        {msg.corrections && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            style={{ animation: 'slideInUp 0.35s ease-out both' }}>
            <div className="px-5 py-3.5 border-b border-green-100 bg-green-50 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-sm font-semibold text-green-800">{msg.corrections.length} issues corrected & downloaded</span>
            </div>
            <div className="divide-y divide-slate-100">
              {msg.corrections.map((err, i) => (
                <div key={i} className="p-5" style={{ animation: `slideInUp 0.3s ease-out ${i*0.06}s both` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SourceBadge source={err.source} />
                    <ImpactBadge severity={err.severity} />
                    <span className="text-sm font-medium text-slate-700">{err.errorType}</span>
                  </div>
                  {err.explanation && (
                    <p className="text-xs text-slate-500 mb-2">{err.explanation}</p>
                  )}
                  {err.codeExample && <CodeBlock code={err.codeExample} />}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
interface Props {
  errors?: any[] | null;
  fileName?: string;
  initialChoice: 'suggestions' | 'full-correction';
  onReset: () => void;
}

const AccessibilityChat: React.FC<Props> = ({ errors: propErrors, fileName, initialChoice, onReset }) => {

  // No dummy data — only real errors from the extension
  const errors = (propErrors ?? []).map(normalizeError);

  const criticalCount = errors.filter(e =>
    ['critical', 'serious'].includes((e.severity || '').toLowerCase())
  ).length;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didRun    = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    runFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMsg = (msg: Omit<Msg, 'id'>) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);

  const runFlow = async () => {
    const isSuggestions = initialChoice === 'suggestions';

    // No errors case
    if (errors.length === 0) {
      addMsg({
        role: 'assistant',
        text: `No accessibility errors were found. Please import errors from the extension before proceeding.`,
      });
      return;
    }

    // 1. Greeting
    addMsg({
      role: 'assistant',
      text: `I've scanned "${fileName || 'your file'}" and found ${errors.length} accessibility issue${errors.length !== 1 ? 's' : ''} — ${criticalCount} critical/serious. ${isSuggestions ? 'Here are my suggestions:' : 'Correcting all issues now…'}`,
    });

    // 2. Show user's choice as their message
    await new Promise(r => setTimeout(r, 400));
    addMsg({ role: 'user', content: isSuggestions ? 'Show Suggestions' : 'Correct My Code' });

    // 3. Typing delay
    await new Promise(r => setTimeout(r, 300));
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 600));
    setIsTyping(false);

    // 4. Results
    if (isSuggestions) {
      addMsg({
        role: 'assistant',
        text: `Here are all ${errors.length} accessibility issues with explanations and code fixes:`,
        suggestions: errors,
      });
    } else {
      addMsg({
        role: 'assistant',
        text: `Done! Your corrected file has been downloaded. Here's a summary of all ${errors.length} fixes applied:`,
        corrections: errors,
      });
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-5px); }
        }
        .chat-scroll::-webkit-scrollbar       { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>

      <div className="flex flex-col h-full min-h-0">

        {/* Sub-header */}
        <div className="flex-shrink-0 bg-white/70 backdrop-blur-md border-b border-orange-100 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {errors.length} issues · {criticalCount} critical
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium border shadow-sm bg-white border-slate-200 text-slate-600">
                {initialChoice === 'suggestions' ? '💡 Suggestions mode' : '🔧 Full correction mode'}
              </span>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 transition-colors px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-orange-300 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Upload New File
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
            {isTyping && <TypingDots />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="flex-shrink-0 bg-white/70 backdrop-blur-md border-t border-orange-100 px-6 py-3">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-slate-400">
              {isTyping ? 'AI is thinking…' : '✓ Analysis complete — scroll up to review results'}
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default AccessibilityChat;