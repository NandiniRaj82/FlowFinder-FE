'use client';

import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewInner,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';

/* ──────────────────────────────────────────────────────────────────────── */
/* Types                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

type Framework = 'html' | 'react' | 'nextjs' | 'vue' | 'angular';

interface SandpackPreviewProps {
  framework: Framework;
  code: string;
  /** Optional: extra files Sandpack should know about */
  extraFiles?: Record<string, { code: string }>;
  height?: string | number;
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Loading status component (must be inside SandpackProvider)              */
/* ──────────────────────────────────────────────────────────────────────── */

const StatusOverlay = () => {
  const { sandpack } = useSandpack();
  const loading = sandpack.status === 'idle' || sandpack.status === 'running';

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        zIndex: 10,
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(99,102,241,0.3)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'sans-serif' }}>
        Booting sandbox…
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Main component                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

const SandpackPreview: React.FC<SandpackPreviewProps> = ({
  framework,
  code,
  extraFiles = {},
  height = '100%',
  className = '',
}) => {
  /* ── Map framework → Sandpack template + entry file ── */
  const config = (() => {
    switch (framework) {
      case 'react':
      case 'nextjs':
        return {
          template: 'react' as const,
          files: {
            '/App.js': { code, active: true },
            ...extraFiles,
          },
        };
      case 'vue':
        return {
          template: 'vue' as const,
          files: {
            '/src/App.vue': { code, active: true },
            ...extraFiles,
          },
        };
      case 'angular':
        return {
          template: 'angular' as const,
          files: {
            '/src/app/app.component.ts': { code, active: true },
            ...extraFiles,
          },
        };
      default:
        // Fallback — should not reach here for HTML (use iframe instead)
        return {
          template: 'static' as const,
          files: {
            '/index.html': { code, active: true },
            ...extraFiles,
          },
        };
    }
  })();

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}
    >
      <SandpackProvider
        template={config.template}
        files={config.files}
        options={{
          externalResources: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          ],
        }}
        theme="dark"
      >
        <SandpackLayout style={{ border: 'none', height: '100%' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <StatusOverlay />
            <SandpackPreviewInner
              style={{ height: '100%' }}
              showOpenInCodeSandbox={false}
              showNavigator={false}
              showRefreshButton={false}
            />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};

export default SandpackPreview;
