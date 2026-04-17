'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Suggestion {
  errorNumber?: number;
  errorType?: string;
  severity?: string;
  location?: string;
  explanation?: string;
  originalCode?: string;
  codeExample?: string;
  wcagReference?: string;
  title?: string;
  impact?: string;
  source?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: Suggestion[];
}

interface Props {
  errors: Suggestion[] | null;
  fileName: string;
  initialChoice: 'suggestions' | 'full-correction';
  onReset: () => void;
  sessionId?: string;
}

const normalize = (e: any): Suggestion => ({
  errorType:    e.errorType    || e.title     || e.type  || 'Accessibility Issue',
  severity:     e.severity     || e.impact    || 'low',
  location:     e.location     || e.selector  || '',
  explanation:  e.explanation  || e.message   || e.description || '',
  originalCode: e.originalCode || '',
  codeExample:  e.codeExample  || e.fix       || '',
  wcagReference:e.wcagReference|| e.wcag      || '',
  source:       e.source       || '',
});

const SeverityBadge = ({ severity }: { severity: string }) => {
  const s = (severity || 'low').toLowerCase();
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    serious:  'bg-red-100 text-red-700 border-red-200',
    moderate: 'bg-orange-100 text-orange-700 border-orange-200',
    minor:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    low:      'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[s] || styles.low}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const SuggestionCard = ({ s, i }: { s: Suggestion; i: number }) => {
  const [expanded, setExpanded] = useState(false);
  const norm = normalize(s);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      style={{ animation: `slideUp 0.3s ease-out ${i * 0.06}s both` }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{norm.errorType}</p>
              {norm.location && <p className="text-xs text-orange-500 mt-0.5 truncate">📍 {norm.location}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SeverityBadge severity={norm.severity || ''} />
            {norm.source && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${norm.source === 'lighthouse' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                {norm.source === 'lighthouse' ? '🔦' : '🪓'}
              </span>
            )}
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
          {norm.explanation && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">What's wrong</p>
              <p className="text-sm text-slate-700 leading-relaxed">{norm.explanation}</p>
            </div>
          )}
          {norm.originalCode && (
            <div>
              <p className="text-xs font-bold text-red-500 mb-1">❌ Original code</p>
              <pre className="text-xs bg-red-50 border border-red-100 rounded-xl p-3 overflow-x-auto text-red-800 whitespace-pre-wrap">{norm.originalCode}</pre>
            </div>
          )}
          {norm.codeExample && (
            <div>
              <p className="text-xs font-bold text-green-600 mb-1">✅ Fixed code</p>
              <pre className="text-xs bg-green-50 border border-green-100 rounded-xl p-3 overflow-x-auto text-green-800 whitespace-pre-wrap">{norm.codeExample}</pre>
            </div>
          )}
          {norm.wcagReference && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono inline-block">{norm.wcagReference}</span>
          )}
        </div>
      )}
    </div>
  );
};

const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
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

const RenderText = ({ text }: { text: string }) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
          return <pre key={i} className="bg-slate-900 text-green-400 rounded-xl p-3 overflow-x-auto text-xs whitespace-pre-wrap mt-2">{code}</pre>;
        }
        return <p key={i} className="whitespace-pre-wrap">{part}</p>;
      })}
    </div>
  );
};

const ChatMessage = ({ msg }: { msg: Message }) => {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end" style={{ animation: 'slideUp 0.3s ease-out both' }}>
        <div className="max-w-sm bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3" style={{ animation: 'slideUp 0.3s ease-out both' }}>
      <BotAvatar />
      <div className="flex-1 min-w-0 space-y-3">
        {msg.text && (
          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-2xl">
            <RenderText text={msg.text} />
          </div>
        )}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2">
            {msg.suggestions.map((s, i) => <SuggestionCard key={i} s={s} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const AccessibilityChat: React.FC<Props> = ({ errors, fileName, initialChoice, onReset, sessionId: propSessionId }) => {
  const suggestions = (errors || []).map(normalize);
  const criticalCount = suggestions.filter(s => s.severity === 'critical' || s.severity === 'serious').length;

  const [messages, setMessages]   = useState<Message[]>([]);
  const [isTyping, setIsTyping]   = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(propSessionId || '');
  // Track whether chat hint message has been added
  const chatHintAdded = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const didRun    = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // When sessionId arrives (after API response), update state and add chat hint
  useEffect(() => {
    if (propSessionId && propSessionId !== sessionId) {
      setSessionId(propSessionId);
      // Add chat hint message if not already added
      if (!chatHintAdded.current) {
        chatHintAdded.current = true;
        setMessages(prev => [
          ...prev,
          {
            id: `hint-${Date.now()}`,
            role: 'assistant',
            text: `💬 Chat is enabled! Ask me anything about these issues:\n• "Explain issue #1 in detail"\n• "How do I fix the button accessibility issue?"\n• "Which issue should I fix first?"\n• "What is WCAG 2.1?"`,
          }
        ]);
      }
    }
  }, [propSessionId]);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    runInitialFlow();
  }, []);

  const addMsg = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ...msg }]);

  const runInitialFlow = async () => {
    if (suggestions.length === 0) {
      addMsg({ role: 'assistant', text: `I've scanned "${fileName}" and found no accessibility issues. Your code looks great! 🎉` });
      return;
    }
    addMsg({
      role: 'assistant',
      text: `I've scanned "${fileName}" and found ${suggestions.length} accessibility issue${suggestions.length !== 1 ? 's' : ''} — ${criticalCount} critical/serious. Here are my suggestions:`,
    });
    await new Promise(r => setTimeout(r, 400));
    addMsg({ role: 'user', text: 'Show Suggestions' });
    await new Promise(r => setTimeout(r, 300));
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 800));
    setIsTyping(false);
    addMsg({
      role: 'assistant',
      text: `Here are all ${suggestions.length} accessibility issues with explanations and code fixes:`,
      suggestions,
    });
    // Chat hint will be added by the propSessionId useEffect once sessionId arrives
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !sessionId) return;
    setInputText('');
    addMsg({ role: 'user', text });
    setIsSending(true);
    setIsTyping(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/accessibility/chat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await response.json();
      setIsTyping(false);
      addMsg({ role: 'assistant', text: data.success ? data.reply : `❌ ${data.message}` });
    } catch {
      setIsTyping(false);
      addMsg({ role: 'assistant', text: '❌ Network error. Please try again.' });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const quickQuestions = [
    'Explain the most critical issue',
    'Show me how to fix issue #1',
    'Which issue should I fix first?',
    'What is WCAG 2.1?',
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-track{background:transparent}
        .chat-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px}
      `}</style>

      <div className="flex flex-col h-screen min-h-0">

        {/* Sub-header */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {suggestions.length} issues · {criticalCount} critical
              </span>
              <span className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full shadow-sm truncate max-w-xs">
                📄 {fileName}
              </span>
              {sessionId && (
                <span className="text-xs bg-green-50 border border-green-200 text-green-600 px-3 py-1.5 rounded-full">
                  💬 Chat enabled
                </span>
              )}
            </div>
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-orange-300 shadow-sm transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
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

        {/* Quick questions — only show after chat hint appears */}
        {sessionId && messages.length > 3 && !isSending && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
              {quickQuestions.map((q, i) => (
                <button key={i}
                  onClick={() => { setInputText(q); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 bg-white border border-orange-200 text-orange-600 rounded-full hover:bg-orange-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-t border-orange-100 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {sessionId ? (
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask about any accessibility issue… (Enter to send)"
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 transition-colors disabled:opacity-50"
                />
                <button onClick={handleSend} disabled={!inputText.trim() || isSending}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0
                    ${inputText.trim() && !isSending
                      ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg hover:-translate-y-0.5'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                  {isSending
                    ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  }
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400">
                ✓ Analysis complete — scroll up to review results
              </p>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default AccessibilityChat;