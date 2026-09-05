'use client';

import React from 'react';
import { color } from '@/lib/tokens';

/** The small context panel that sits at the foot of an authority sidebar. */
export default function SidePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: color.a.panel,
        border: `1px solid ${color.a.line}`,
        borderRadius: 12,
        padding: 13,
      }}
    >
      <div className="lbl" style={{ color: color.a.muted, marginBottom: 9 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
