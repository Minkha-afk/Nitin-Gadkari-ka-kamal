'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/chrome/TopNav';
import { ThemeProvider } from '@/components/system';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith('/drive');

  return (
    <ThemeProvider value={bare ? 'dark' : 'light'}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: bare ? '#000' : 'var(--paper)',
          color: bare ? '#EDEDED' : 'var(--ink)',
        }}
      >
        {bare ? null : <TopNav />}
        {/* The page scrolls, not an inner pane: a consumer site should feel
            like a page, and a fixed-height shell fights every long section. */}
        <main style={{ flex: 1, minHeight: 0, paddingBottom: bare ? 0 : 96 }}>{children}</main>
      </div>
    </ThemeProvider>
  );
}
