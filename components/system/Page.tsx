'use client';

import React from 'react';
import { surf } from '@/lib/tokens';
import { useTheme } from './index';

/** Authority main column: fixed height, internal panels scroll, never the page. */
export function Main({
  children,
  wide,
  style,
}: {
  children: React.ReactNode;
  wide?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <main
      className="scrollarea"
      style={{
        flex: 1,
        minWidth: 0,
        padding: wide ? '18px 22px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        ...style,
      }}
    >
      {children}
    </main>
  );
}

export function PageHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        flexShrink: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1 className="h1" style={{ color: s.ink }}>
          {title}
        </h1>
        {sub ? (
          <p className="sub" style={{ color: s.muted, marginTop: 7 }}>
            {sub}
          </p>
        ) : null}
      </div>
      {right ? (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>{right}</div>
      ) : null}
    </div>
  );
}
