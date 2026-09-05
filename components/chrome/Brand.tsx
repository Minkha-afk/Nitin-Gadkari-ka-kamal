'use client';

import React from 'react';
import { color, type Theme } from '@/lib/tokens';

/** The lane-stripe glyph. Used in the wordmark and, at larger scale, as a legend divider. */
export function LaneGlyph({ size = 26, radius = 8 }: { size?: number; radius?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: '#111',
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '-25%',
          width: 3,
          height: '150%',
          transform: 'translateX(-50%) rotate(24deg)',
          background: `repeating-linear-gradient(180deg, ${color.mark} 0 5px, transparent 5px 10px)`,
        }}
      />
    </span>
  );
}

export default function Brand({ theme = 'light', size = 19 }: { theme?: Theme; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <LaneGlyph size={26} />
      <span
        style={{
          fontSize: size,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: theme === 'dark' ? '#EDEDED' : '#0A0A0A',
        }}
      >
        Road<span style={{ color: color.mark }}>Sense</span>
      </span>
    </span>
  );
}
