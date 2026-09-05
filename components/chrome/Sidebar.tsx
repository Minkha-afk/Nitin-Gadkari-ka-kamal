'use client';

import React from 'react';
import { color } from '@/lib/tokens';

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside
      className="scrollarea rs-sidebar"
      aria-label="Filters"
      style={{
        width: 236,
        flexShrink: 0,
        background: '#000',
        borderRight: `1px solid ${color.a.line}`,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {children}
    </aside>
  );
}
