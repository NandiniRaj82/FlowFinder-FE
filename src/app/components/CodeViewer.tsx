'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface CodeViewerProps {
  code: string;
  framework: string;
  filename?: string;
  height?: string | number;
}

function getLanguage(framework: string): string {
  switch (framework) {
    case 'react': case 'nextjs': return 'jsx';
    case 'vue': return 'vue';
    case 'angular': return 'ts';
    default: return 'html';
  }
}

function getExtension(framework: string): string {
  switch (framework) {
    case 'react': case 'nextjs': return 'jsx';
    case 'vue': return 'vue';
    case 'angular': return 'ts';
    default: return 'html';
  }
}

function fwColor(framework: string): string {
  const m: Record<string, string> = {
    html: '#e34c26', react: '#61dafb', nextjs: '#ffffff',
    vue: '#42b883', angular: '#dd0031',
  };
  return m[framework] ?? '#a5b4fc';
}

// ── Lightweight token-based syntax highlighter ──────────────────────────────
// Covers the main token types without any external dependency.
function highlight(code: string, lang: string): string {
  // Escape HTML entities first
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let escaped = esc(code);

  if (lang === 'html') {
    // HTML: tags, attributes, strings, comments
    escaped = escaped
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6b7280">$1</span>')
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#f87171">$2</span>')
      .replace(/([\w-]+)=/g, '<span style="color:#93c5fd">$1</span>=')
      .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|"[^"]*"|'[^']*')/g,
        '<span style="color:#86efac">$1</span>');
    return escaped;
  }

  // JSX / TS / Vue — shared JS token rules
  const keywords = /\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|extends|new|this|typeof|instanceof|async|await|try|catch|throw|true|false|null|undefined|void|type|interface|implements|React|useState|useEffect|useCallback|useRef|ref|onMounted|computed|props|emit)\b/g;
  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
  const comments = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
  const jsxTags = /(&lt;\/?)([\w.]+)/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const operators = /(\{|\}|\(|\)|\[|\]|=>|===|!==|==|!=|\+=|-=|&&|\|\||!)/g;

  // Order matters — do comments and strings first so keywords inside them don't get colored
  const placeholders: string[] = [];
  let ph = escaped;

  // Comments
  ph = ph.replace(comments, (m) => {
    const i = placeholders.length;
    placeholders.push(`<span style="color:#6b7280;font-style:italic">${m}</span>`);
    return `\x00PH${i}\x00`;
  });

  // Strings
  ph = ph.replace(strings, (m) => {
    const i = placeholders.length;
    placeholders.push(`<span style="color:#86efac">${m}</span>`);
    return `\x00PH${i}\x00`;
  });

  // Keywords
  ph = ph.replace(keywords, '<span style="color:#c084fc">$1</span>');

  // Numbers
  ph = ph.replace(numbers, '<span style="color:#fb923c">$1</span>');

  // JSX tag names
  if (lang === 'jsx' || lang === 'vue') {
    ph = ph.replace(jsxTags, (_, slash, tag) => {
      const color = /^[A-Z]/.test(tag) ? '#67e8f9' : '#f87171';
      return `${slash}<span style="color:${color}">${tag}</span>`;
    });
  }

  // Restore placeholders
  ph = ph.replace(/\x00PH(\d+)\x00/g, (_, i) => placeholders[parseInt(i)]);

  return ph;
}

// ── Main Component ────────────────────────────────────────────────────────────
const CodeViewer: React.FC<CodeViewerProps> = ({ code, framework, filename, height = 500 }) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const ext = getExtension(framework);
  const lang = getLanguage(framework);
  const displayName = filename ?? `design.${ext}`;
  const color = fwColor(framework);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = displayName;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, displayName]);

  const highlighted = highlight(code, lang);

  const containerH = typeof height === 'number' ? `${height}px` : height;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: containerH, background: '#0d1117',
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid rgba(99,102,241,0.18)',
      fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: '#161b22',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        {/* Left: traffic lights + filename */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#8b949e' }}>{displayName}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            background: 'rgba(99,102,241,0.15)', color,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{lang}</span>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setWordWrap(w => !w)} title="Toggle word wrap" style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: wordWrap ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${wordWrap ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: wordWrap ? '#a5b4fc' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit',
          }}>wrap</button>

          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`,
            color: copied ? '#34d399' : '#a5b4fc', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>
            {copied ? (
              <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg> Copied!</>
            ) : (
              <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg> Copy</>
            )}
          </button>

          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            .{ext}
          </button>
        </div>
      </div>

      {/* ── Code area ── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Line numbers gutter */}
        <div style={{ display: 'flex', minHeight: '100%' }}>
          <div style={{
            flexShrink: 0, padding: '16px 8px 16px 16px',
            color: '#374151', fontSize: 12, lineHeight: '20px',
            textAlign: 'right', userSelect: 'none',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            {code.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre
            ref={preRef}
            style={{
              margin: 0, padding: '16px 20px',
              fontSize: 12.5, lineHeight: '20px',
              color: '#e2e8f0', background: 'transparent',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-all' : 'normal',
              overflow: 'visible', flex: 1,
              tabSize: 2,
            }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      </div>

      {/* Footer: line count */}
      <div style={{
        padding: '4px 14px', background: '#161b22',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: '#4b5563' }}>
          {code.split('\n').length} lines · {(code.length / 1024).toFixed(1)} KB
        </span>
      </div>
    </div>
  );
};

export default CodeViewer;
