'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import PRCreator from './PRCreator';

// Monaco editor loaded lazily — heavy but gives VS Code quality diff view
const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.DiffEditor),
  { ssr: false, loading: () => <div style={{ height: '400px', background: '#1e1e1e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px' }}>Loading editor...</div> }
);

interface MappedFile {
  filePath: string;
  diff: string;
  confidence: number;
  changes: { original: string; fixed: string; reason: string }[];
  originalContent?: string;  // full original file
  fixedContent?: string;     // full fixed file
}

interface DiffViewerProps {
  sessionId: string;
  mappedFiles: MappedFile[];
  unmappedErrors: any[];
  repoFullName: string;
  onBack: () => void;
}

export default function DiffViewer({ sessionId, mappedFiles, unmappedErrors, repoFullName, onBack }: DiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<MappedFile | null>(mappedFiles[0] || null);
  const [acceptedFiles, setAcceptedFiles] = useState<Set<string>>(new Set(mappedFiles.map(f => f.filePath)));
  const [showPRCreator, setShowPRCreator] = useState(false);

  const toggleAccept = (filePath: string) => {
    setAcceptedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const confidenceColor = (c: number) => c >= 80 ? '#22c55e' : c >= 50 ? '#f59e0b' : '#ef4444';
  const confidenceLabel = (c: number) => c >= 80 ? 'High' : c >= 50 ? 'Medium' : 'Low';

  // Count real added/removed lines from the diff or from original/fixed content
  const diffCounts = (file: MappedFile): { added: number; removed: number } => {
    // Preferred: compare original vs fixed content line-by-line
    if (file.originalContent && file.fixedContent) {
      const origLines = new Set(file.originalContent.split('\n'));
      const fixedLines = new Set(file.fixedContent.split('\n'));
      const origArr = file.originalContent.split('\n');
      const fixedArr = file.fixedContent.split('\n');
      let removed = 0, added = 0;
      origArr.forEach(l => { if (!fixedLines.has(l)) removed++; });
      fixedArr.forEach(l => { if (!origLines.has(l)) added++; });
      return { added, removed };
    }
    // Fallback: parse unified diff string
    if (file.diff) {
      const lines = file.diff.split('\n');
      const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
      const removed = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
      return { added, removed };
    }
    return { added: file.changes.length, removed: file.changes.length };
  };

  if (showPRCreator) {
    return (
      <PRCreator
        sessionId={sessionId}
        acceptedFiles={[...acceptedFiles]}
        repoFullName={repoFullName}
        onBack={() => setShowPRCreator(false)}
      />
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Review Fixes</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {mappedFiles.length} file{mappedFiles.length !== 1 ? 's' : ''} with fixes · {acceptedFiles.size} accepted
            {unmappedErrors.length > 0 && <span style={{ color: '#f59e0b' }}> · {unmappedErrors.length} errors couldn't be mapped</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onBack} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <button
            onClick={() => setShowPRCreator(true)}
            disabled={acceptedFiles.size === 0}
            style={{ padding: '10px 20px', background: acceptedFiles.size === 0 ? '#e2e8f0' : 'linear-gradient(135deg,#1e293b,#334155)', border: 'none', borderRadius: '10px', cursor: acceptedFiles.size === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, color: acceptedFiles.size === 0 ? '#94a3b8' : '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            Raise PR ({acceptedFiles.size})
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* File tree sidebar */}
        <div style={{ width: '260px', flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Changed Files</p>
            </div>
            {mappedFiles.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No files mapped</div>
            ) : (
              <div>
                {mappedFiles.map(file => {
                  const isSelected = selectedFile?.filePath === file.filePath;
                  const isAccepted = acceptedFiles.has(file.filePath);
                  const parts = file.filePath.split('/');
                  const fileName = parts[parts.length - 1];
                  const dir = parts.slice(0, -1).join('/');

                  return (
                    <div
                      key={file.filePath}
                      onClick={() => setSelectedFile(file)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: isSelected ? '#fff7ed' : '#fff', borderLeft: isSelected ? '3px solid #ea580c' : '3px solid transparent', transition: 'all 0.1s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {/* Accept checkbox */}
                        <div
                          onClick={e => { e.stopPropagation(); toggleAccept(file.filePath); }}
                          style={{ marginTop: '1px', width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${isAccepted ? '#22c55e' : '#d1d5db'}`, background: isAccepted ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                        >
                          {isAccepted && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: isSelected ? '#ea580c' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</p>
                          {dir && <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dir}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>−{diffCounts(file).removed}</span>
                            <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700 }}>+{diffCounts(file).added}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: confidenceColor(file.confidence) }} />
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{confidenceLabel(file.confidence)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unmapped errors */}
            {unmappedErrors.length > 0 && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 14px', background: '#fffbeb' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#a16207', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>Not mapped ({unmappedErrors.length})</p>
                {unmappedErrors.slice(0, 3).map((e, i) => (
                  <p key={i} style={{ margin: '0 0 4px', fontSize: '11px', color: '#92400e' }}>{e.error?.title || e.error?.type || 'Unknown error'}</p>
                ))}
                {unmappedErrors.length > 3 && <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>+{unmappedErrors.length - 3} more</p>}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '12px', padding: '12px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Confidence</p>
            {[['High', '≥80%', '#22c55e'], ['Medium', '50-79%', '#f59e0b'], ['Low', '<50%', '#ef4444']].map(([label, range, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>{range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diff panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedFile ? (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              Select a file to view changes
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
              {/* File header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{selectedFile.filePath}</code>
                  <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, borderRadius: '20px' }}>
                    {selectedFile.changes.length} fix{selectedFile.changes.length !== 1 ? 'es' : ''}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: confidenceColor(selectedFile.confidence) }} />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedFile.confidence}% confidence</span>
                  </div>
                </div>
                <div
                  onClick={() => toggleAccept(selectedFile.filePath)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: acceptedFiles.has(selectedFile.filePath) ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${acceptedFiles.has(selectedFile.filePath) ? '#86efac' : '#fca5a5'}`, borderRadius: '8px', cursor: 'pointer' }}
                >
                  {acceptedFiles.has(selectedFile.filePath) ? (
                    <>
                      <svg width="14" height="14" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Accepted</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>Rejected</span>
                    </>
                  )}
                </div>
              </div>

              {/* Monaco diff editor — shows full original vs full fixed file */}
              <div style={{ height: '500px' }}>
                <MonacoDiffEditor
                  language={
                    /\.(css|scss|less|sass)$/i.test(selectedFile.filePath) ? 'css' :
                    /\.html?$/i.test(selectedFile.filePath) ? 'html' :
                    /\.(jsx|tsx)$/.test(selectedFile.filePath) ? 'typescript' :
                    /\.vue$/i.test(selectedFile.filePath) ? 'html' :
                    /\.svelte$/i.test(selectedFile.filePath) ? 'html' :
                    /\.(js|mjs|cjs)$/.test(selectedFile.filePath) ? 'javascript' :
                    'typescript'
                  }
                  original={selectedFile.originalContent ?? selectedFile.changes.map(c => c.original).join('\n\n// ---\n\n')}
                  modified={selectedFile.fixedContent ?? selectedFile.changes.map(c => c.fixed).join('\n\n// ---\n\n')}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    renderSideBySide: true,
                    fontSize: 13,
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 12 },
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  }}
                />
              </div>

              {/* Change explanations — skip placeholder entries */}
              {selectedFile.changes.filter(c => c.reason && c.original !== '[full file replacement]' || c.reason).length > 0 && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fix explanations</p>
                  {selectedFile.changes.map((change, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #ea580c' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>{change.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
