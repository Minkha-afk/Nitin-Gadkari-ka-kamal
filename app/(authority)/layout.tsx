'use client';

import React from 'react';
import Rail from '@/components/chrome/Rail';
import TopBar from '@/components/chrome/TopBar';
import { RoleProvider } from '@/components/chrome/RoleContext';
import { ThemeProvider } from '@/components/system';
import { color } from '@/lib/tokens';

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider value="dark">
      <RoleProvider>
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
      </RoleProvider>
    </ThemeProvider>
  );
}
