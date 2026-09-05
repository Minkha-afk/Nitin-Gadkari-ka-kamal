'use client';

import React from 'react';
import Rail from '@/components/chrome/Rail';
import TopBar from '@/components/chrome/TopBar';
import { ScopeProvider } from '@/components/chrome/ScopeContext';
import { ThemeProvider } from '@/components/system';
import type { AuthorityTree } from '@/lib/authority';
import { color } from '@/lib/tokens';

export default function AuthorityShell({
  tree,
  scope,
  scopeLabel,
  children,
}: {
  tree: AuthorityTree;
  scope: string | null;
  scopeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider value="dark">
      <ScopeProvider tree={tree} scope={scope} scopeLabel={scopeLabel}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            background: color.a.bg,
            color: color.a.ink,
            overflow: 'hidden',
          }}
        >
          <Rail />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <TopBar />
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</div>
          </div>
        </div>
      </ScopeProvider>
    </ThemeProvider>
  );
}
