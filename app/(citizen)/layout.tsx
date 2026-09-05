'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/chrome/TopNav';
import { ThemeProvider } from '@/components/system';
import { color } from '@/lib/tokens';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith('/drive');
  return (
    <ThemeProvider value={bare ? 'dark' : 'light'}>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: bare ? '#000' : color.c.bg,
          color: bare ? color.a.ink : color.c.ink,
          overflow: 'hidden',
        }}
      >
        {bare ? null : <TopNav />}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
