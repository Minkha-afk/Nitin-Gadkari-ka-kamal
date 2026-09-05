'use client';

import React from 'react';
import { mulberry32 } from './RoadMap';
import { color, surf, type Theme } from '@/lib/tokens';

export default function RoughnessTrace({
  width,
  height,
  rough = false,
  theme = 'dark',
  seed = 3,
}: {
  width: number;
  height: number;
  rough?: boolean;
  theme?: Theme;
  seed?: number;
}) {
  const s = surf(theme);
  const rnd = mulberry32(seed * 7723 + (rough ? 91 : 17));
  const amp = height * 0.035;
  const mid = height / 2;
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    let v = (Math.sin(i / 7) * 2 + Math.sin(i / 3.1) * 1.2) * (rough ? 1 : 0.28);
    if (rough && rnd() < 0.07) v += (6 + rnd() * 8) * (rnd() < 0.5 ? -1 : 1);
    pts.push(`${((i / (n - 1)) * width).toFixed(2)},${(mid - v * amp).toFixed(2)}`);
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
      role="img"
      aria-label={rough ? 'Ride quality trace: rough road' : 'Ride quality trace: smooth road'}
    >
      <line x1="0" y1={mid} x2={width} y2={mid} stroke={s.line} strokeWidth={1} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={rough ? color.red : theme === 'dark' ? color.greenLift : color.green}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
