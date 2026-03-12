'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ── Severity color map ──────────────────────────────────────────────────── */
const SEVERITY_STYLES: Record<string, { pill: string; dot: string }> = {
  critical: { pill: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
  major:    { pill: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  minor:    { pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const safe = (severity || 'minor').toLowerCase();
  const s = SEVERITY_STYLES[safe] || SEVERITY_STYLES.minor;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {safe.charAt(0).toUpperCase() + safe.slice(1)}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
    {category}
  </span>
);

const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
    </svg>
  </div>
);

const TypingDots = () => (
  <div className="flex items-start gap-3">
    <BotAvatar />
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-violet-400"
            style={{ animation: `dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
    </div>
  </div>
);

interface Mismatch {
  issueNumber: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  figmaValue: string;
  liveValue: string;
}

interface Msg {
  id: string | number;
  role: 'user' | 'assistant';
  content?: string;
  text?: string;
  mismatches?: Mismatch[];
}

const MismatchCard = ({ m, i }: { m: Mismatch; i: number }) => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
    style={{ animation: `slideInUp 0.35s ease-out ${i * 0.06}s both` }}>
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {m.issueNumber}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{m.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <CategoryBadge category={m.category} />
          <SeverityBadge severity={m.severity} />
        </div>
      </div>

      {/* Location */}
      <p className="text-xs text-violet-500 font-medium mb-2">📍 {m.location}</p>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{m.description}</p>

      {/* Figma vs Live comparison */}
      {(m.figmaValue !== 'N/A' || m.liveValue !== 'N/A') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs font-bold text-green-700 mb-1">🎨 Figma Design</p>
            <p className="text-xs text-green-800 font-mono">{m.figmaValue}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-bold text-red-700 mb-1">🌐 Live Site</p>
            <p className="text-xs text-red-800 font-mono">{m.liveValue}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const ChatMessage = ({ msg }: { msg: Msg }) => {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end" style={{ animation: 'slideInUp 0.3s ease-out both' }}>
        <div className="max-w-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
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
        {msg.mismatches && (
          <div className="space-y-3">
            {msg.mismatches.map((m, i) => <MismatchCard key={i} m={m} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  mismatches: Mismatch[];
  websiteUrl: string;
  figmaUrl: string;
  onReset: () => void;
}

const MatchDesignChat: React.FC<Props> = ({ mismatches, websiteUrl, figmaUrl, onReset }) => {
  const criticalCount = mismatches.filter(m => m.severity === 'critical').length;
  const majorCount    = mismatches.filter(m => m.severity === 'major').length;

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
    if (mismatches.length === 0) {
      addMsg({ role: 'assistant', text: `Great news! No mismatches found between your live site and Figma design. They look identical! 🎉` });
      return;
    }

    addMsg({
      role: 'assistant',
      text: `I've compared your live site (${new URL(websiteUrl).hostname}) against your Figma design and found ${mismatches.length} mismatch${mismatches.length !== 1 ? 'es' : ''} — ${criticalCount} critical, ${majorCount} major.`,
    });

    await new Promise(r => setTimeout(r, 400));
    addMsg({ role: 'user', content: 'Show me the mismatches' });

    await new Promise(r => setTimeout(r, 300));
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 500));
    setIsTyping(false);

    addMsg({
      role: 'assistant',
      text: `Here are all ${mismatches.length} design mismatches with Figma vs live site values:`,
      mismatches,
    });
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
        <div className="flex-shrink-0 bg-white/70 backdrop-blur-md border-b border-violet-100 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {mismatches.length} mismatches · {criticalCount} critical
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium border shadow-sm bg-white border-slate-200 text-slate-500 truncate max-w-xs">
                🌐 {new URL(websiteUrl).hostname}
              </span>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-violet-300 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              New Comparison
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

        {/* Bottom bar */}
        <div className="flex-shrink-0 bg-white/70 backdrop-blur-md border-t border-violet-100 px-6 py-3">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-slate-400">
              {isTyping ? 'AI is analysing…' : '✓ Comparison complete — scroll up to review results'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchDesignChat;