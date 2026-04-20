'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface BoundingBox { x: number; y: number; width: number; height: number; }
interface Mismatch {
  issueNumber: number; category: string; severity: string;
  title: string; description: string; location: string;
  figmaValue: string; liveValue: string; boundingBox?: BoundingBox;
}
interface Msg { id: string|number; role:'user'|'assistant'; content?:string; text?:string; mismatches?:Mismatch[]; }
interface Props {
  mismatches: Mismatch[]; websiteUrl: string; figmaUrl: string; onReset: () => void;
  matchPercentage?: number; accuracyLabel?: string;
  matchScore?: number; projectedScore?: number;
  websiteScreenshotBase64?: string; figmaScreenshotBase64?: string;
}

/* ── Severity helpers ───────────────────────────────────────────────────────── */
const SEV: Record<string,{pill:string;dot:string}> = {
  critical:{ pill:'bg-red-100 text-red-700',      dot:'bg-red-500'    },
  major:   { pill:'bg-orange-100 text-orange-700', dot:'bg-orange-500' },
  minor:   { pill:'bg-yellow-100 text-yellow-700', dot:'bg-yellow-400' },
};
const SeverityBadge = ({severity}:{severity:string}) => {
  const s = SEV[(severity||'minor').toLowerCase()] || SEV.minor;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.pill}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{severity}</span>;
};
const scoreColor = (n:number) => n>=76?'text-emerald-600 bg-emerald-50 border-emerald-300': n>=41?'text-orange-600 bg-orange-50 border-orange-300':'text-red-600 bg-red-50 border-red-300';

/* ── BotAvatar / TypingDots ─────────────────────────────────────────────────── */
const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
  </div>
);
const TypingDots = () => (
  <div className="flex items-start gap-3"><BotAvatar/>
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex gap-1">{[0,1,2].map(i=><span key={i} className="w-2 h-2 rounded-full bg-violet-400" style={{animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
    </div>
  </div>
);

/* ── MismatchCard ───────────────────────────────────────────────────────────── */
const MismatchCard = ({m,i,active,onClick}:{m:Mismatch;i:number;active:boolean;onClick:()=>void}) => (
  <div onClick={onClick} className={`bg-white border rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all ${active?'border-violet-400 ring-2 ring-violet-200':'border-slate-100 hover:border-violet-200'}`} style={{animation:`slideInUp 0.35s ease-out ${i*0.05}s both`}}>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{m.issueNumber}</span>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{m.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">{m.category}</span>
          <SeverityBadge severity={m.severity}/>
        </div>
      </div>
      <p className="text-xs text-violet-500 font-medium mb-2">📍 {m.location}</p>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{m.description}</p>
      {(m.figmaValue && m.figmaValue!=='N/A') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-xs font-bold text-green-700 mb-1">🎨 Figma</p><p className="text-xs text-green-800 font-mono break-words">{m.figmaValue}</p></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs font-bold text-red-700 mb-1">🌐 Live</p><p className="text-xs text-red-800 font-mono break-words">{m.liveValue}</p></div>
        </div>
      )}
    </div>
  </div>
);

/* ── ImageWithOverlays ──────────────────────────────────────────────────────── */
const ImageWithOverlays = ({base64,label,mismatches,activeIssue,onHover}:{base64:string;label:string;mismatches:Mismatch[];activeIssue:number|null;onHover:(n:number|null)=>void}) => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
      <span className={`w-2 h-2 rounded-full ${label.includes('Live')?'bg-violet-500':'bg-emerald-500'}`}/>{label}
    </div>
    <div className="flex-1 overflow-auto relative bg-slate-100">
      {base64 ? (
        <div className="relative inline-block w-full">
          <img src={`data:image/jpeg;base64,${base64}`} alt={label} className="w-full block" draggable={false}/>
          {mismatches.map(m => m.boundingBox && (
            <div key={m.issueNumber}
              onMouseEnter={()=>onHover(m.issueNumber)}
              onMouseLeave={()=>onHover(null)}
              style={{
                position:'absolute', left:`${m.boundingBox.x}%`, top:`${m.boundingBox.y}%`,
                width:`${m.boundingBox.width}%`, height:`${m.boundingBox.height}%`,
                border: activeIssue===m.issueNumber ? '2px solid #dc2626' : '2px solid #ef4444',
                backgroundColor: activeIssue===m.issueNumber ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)',
                pointerEvents:'auto', cursor:'pointer', transition:'all 0.15s',
              }}
              title={m.title}
            >
              <span style={{position:'absolute',top:2,left:2,background:'#ef4444',color:'#fff',borderRadius:'50%',width:18,height:18,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
                {m.issueNumber}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No screenshot available</div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const MatchDesignChat: React.FC<Props> = ({
  mismatches, websiteUrl, figmaUrl, onReset,
  matchPercentage=0, accuracyLabel='',
  matchScore=0, projectedScore=100,
  websiteScreenshotBase64='', figmaScreenshotBase64='',
}) => {
  const critCount = mismatches.filter(m=>m.severity==='critical').length;
  const majCount  = mismatches.filter(m=>m.severity==='major').length;
  const minCount  = mismatches.filter(m=>m.severity==='minor').length;
  const score     = matchScore || matchPercentage;

  /* ── Mode toggle ── */
  const [mode, setMode] = useState<'issues'|'compare'>('issues');

  /* ── Chat state ── */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didRun    = useRef(false);
  const [activeIssue, setActiveIssue] = useState<number|null>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,isTyping]);
  useEffect(()=>{
    if(didRun.current) return; didRun.current=true; runFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const addMsg = (msg:Omit<Msg,'id'>) => setMessages(prev=>[...prev,{id:Date.now()+Math.random(),...msg}]);

  const runFlow = async () => {
    if(!mismatches.length){ addMsg({role:'assistant',text:'🎉 No mismatches found — your live site perfectly matches the Figma design!'}); return; }
    addMsg({role:'assistant',text:`Compared ${new URL(websiteUrl).hostname} vs Figma — found ${mismatches.length} mismatch${mismatches.length!==1?'es':''}${score>0?` · Match score: ${score}%`:''} (${critCount} critical, ${majCount} major, ${minCount} minor). Switch to 🔍 Compare to see visual overlays.`});
    await new Promise(r=>setTimeout(r,350));
    addMsg({role:'user',content:'Show me all mismatches'});
    await new Promise(r=>setTimeout(r,250));
    setIsTyping(true);
    await new Promise(r=>setTimeout(r,800+Math.random()*500));
    setIsTyping(false);
    addMsg({role:'assistant',text:`Here are all ${mismatches.length} design mismatches:`,mismatches});
  };

  /* ── Draggable divider ── */
  const [leftPct, setLeftPct] = useState(50);
  const dragging   = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDividerMouseDown = useCallback((e:React.MouseEvent)=>{ e.preventDefault(); dragging.current=true; },[]);
  useEffect(()=>{
    const move = (e:MouseEvent)=>{ if(!dragging.current||!containerRef.current) return; const r=containerRef.current.getBoundingClientRect(); setLeftPct(Math.min(85,Math.max(15,((e.clientX-r.left)/r.width)*100))); };
    const up   = ()=>{ dragging.current=false; };
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
  },[]);

  /* ── Gauge vars ── */
  const R=44, C=2*Math.PI*R, offset=C-(score/100)*C;
  const gc = score>=76?'#10b981':score>=41?'#f97316':'#ef4444';
  const bg = score>=76?'#d1fae5':score>=41?'#ffedd5':'#fee2e2';

  return (
    <>
      <style>{`
        @keyframes slideInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .chat-scroll::-webkit-scrollbar{width:4px}.chat-scroll::-webkit-scrollbar-track{background:transparent}.chat-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px}
        .divider-handle{width:12px;cursor:col-resize;background:#fff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:10}
        .divider-handle:hover{background:#f5f3ff;border-color:#8b5cf6}
        .divider-grip{width:4px;height:36px;border-radius:2px;background:#cbd5e1}
        .divider-handle:hover .divider-grip{background:#8b5cf6}
      `}</style>

      <div className="flex flex-col h-full min-h-0">

        {/* ── Mode toggle bar ── */}
        <div className="flex-shrink-0 bg-white border-b border-violet-100 px-5 py-2 flex items-center justify-between">
          <div className="flex gap-1">
            {([['issues','💬 Issues'],['compare','🔍 Compare']] as const).map(([m,label])=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode===m?'bg-violet-600 text-white shadow-sm':'text-slate-500 hover:text-violet-600 hover:bg-violet-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-violet-300 shadow-sm transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            New
          </button>
        </div>

        {/* ── Score + metric panel ── */}
        {score > 0 && (
          <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-slate-100" style={{animation:'fadeIn 0.4s ease-out'}}>
            <div className="max-w-4xl mx-auto flex items-center gap-5">
              <div className="relative flex-shrink-0" style={{width:88,height:88}}>
                <svg width="88" height="88" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={R} fill="none" stroke={bg} strokeWidth="9"/>
                  <circle cx="50" cy="50" r={R} fill="none" stroke={gc} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 50 50)"
                    style={{transition:'stroke-dashoffset 1s ease-out'}}/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black leading-none" style={{color:gc}}>{score}%</span>
                  <span className="text-xs text-slate-400 font-medium">match</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800">Design Accuracy</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor(score)}`}>{accuracyLabel}</span>
                  <span className="ml-auto text-xs text-slate-400">→ After fixes: <span className="font-bold text-emerald-600">{projectedScore}%</span></span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/>{critCount} critical</span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"/>{majCount} major</span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>{minCount} minor</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">🌐 {new URL(websiteUrl).hostname}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ ISSUES MODE ══════════════════════════ */}
        {mode === 'issues' && (
          <>
            <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map(msg => (
                  msg.role==='user'
                    ? <div key={msg.id} className="flex justify-end"><div className="max-w-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm">{msg.content}</div></div>
                    : <div key={msg.id} className="flex items-start gap-3">
                        <BotAvatar/>
                        <div className="flex-1 min-w-0 space-y-3">
                          {msg.text && <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm inline-block max-w-lg"><p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p></div>}
                          {msg.mismatches && <div className="space-y-3">{msg.mismatches.map((m,i)=><MismatchCard key={i} m={m} i={i} active={activeIssue===m.issueNumber} onClick={()=>setActiveIssue(activeIssue===m.issueNumber?null:m.issueNumber)}/>)}</div>}
                        </div>
                      </div>
                ))}
                {isTyping && <TypingDots/>}
                <div ref={bottomRef}/>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white/70 backdrop-blur-md border-t border-violet-100 px-6 py-2 text-center">
              <p className="text-xs text-slate-400">{isTyping?'Analysing…':'✓ Done — click any mismatch to highlight · switch to 🔍 Compare for visual overlays'}</p>
            </div>
          </>
        )}

        {/* ══════════════════════════ COMPARE MODE ══════════════════════════ */}
        {mode === 'compare' && (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Score top bar */}
            <div className="flex-shrink-0 flex items-center justify-center gap-4 py-2 px-4 bg-white/60 border-b border-slate-100 text-xs">
              <span className={`font-bold px-3 py-1 rounded-full border ${scoreColor(score)}`}>Current: {score}%</span>
              <span className="text-slate-400">{critCount} critical · {majCount} major · {minCount} minor</span>
              <span className="font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300">After Fixes: {projectedScore}%</span>
            </div>

            {/* Side-by-side images with draggable divider */}
            <div ref={containerRef} className="flex flex-1 overflow-hidden select-none" style={{userSelect:'none'}}>
              <div className="flex flex-col overflow-hidden" style={{width:`${leftPct}%`}}>
                <ImageWithOverlays base64={websiteScreenshotBase64} label="🌐 Live Site" mismatches={mismatches} activeIssue={activeIssue} onHover={setActiveIssue}/>
              </div>
              <div className="divider-handle" onMouseDown={onDividerMouseDown}><div className="divider-grip"/></div>
              <div className="flex flex-col overflow-hidden" style={{width:`${100-leftPct}%`}}>
                <ImageWithOverlays base64={figmaScreenshotBase64} label="🎨 Figma Design" mismatches={mismatches} activeIssue={activeIssue} onHover={setActiveIssue}/>
              </div>
            </div>

            {/* Clickable issue list below images */}
            <div className="flex-shrink-0 border-t border-slate-200 bg-white overflow-y-auto" style={{maxHeight:200}}>
              <div className="p-3 space-y-1">
                {mismatches.map(m=>(
                  <button key={m.issueNumber} onClick={()=>setActiveIssue(activeIssue===m.issueNumber?null:m.issueNumber)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${activeIssue===m.issueNumber?'bg-violet-50 border border-violet-200':'hover:bg-slate-50 border border-transparent'}`}>
                    <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{m.issueNumber}</span>
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{m.title}</span>
                    <SeverityBadge severity={m.severity}/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default MatchDesignChat;