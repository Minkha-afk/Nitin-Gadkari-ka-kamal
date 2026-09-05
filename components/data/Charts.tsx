'use client';

import React, { useId } from 'react';
import { surf, toneColor, type Theme, type Tone } from '@/lib/tokens';
import { smoothPath } from './RoadMap';

/* ── BarChart ──────────────────────────────────────────────────────── */

export function BarChart({
  data,
  labels,
  width,
  height,
  theme = 'dark',
  highlight = [],
  tone,
  accent,
}: {
  data: number[];
  labels?: string[];
  width: number;
  height: number;
  theme?: Theme;
  highlight?: number[];
  tone?: Tone;
  accent?: string;
}) {
  const s = surf(theme);
  const labelH = labels ? 14 : 0;
  const h = height - labelH;
  const max = Math.max(...data, 1);
  const gap = 4;
  const bw = (width - gap * (data.length - 1)) / data.length;
  const base = accent ?? (tone ? toneColor(tone, theme) : theme === 'dark' ? '#FAFAFA' : '#0A0A0A');
  const track = theme === 'dark' ? '#242424' : '#EAEAEA';
  const useHighlight = highlight.length > 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 4));
        const on = !useHighlight || highlight.includes(i);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={2}
            fill={on ? base : track}
          />
        );
      })}
      {labels
        ? labels.map((l, i) =>
            l ? (
              <text
                key={i}
                x={i * (bw + gap) + bw / 2}
                y={height - 2}
                fontSize={9.5}
                textAnchor="middle"
                fill={s.dim}
              >
                {l}
              </text>
            ) : null,
          )
        : null}
    </svg>
  );
}

/* ── LineChart ─────────────────────────────────────────────────────── */

export function LineChart({
  series,
  labels,
  width,
  height,
  theme = 'dark',
  min,
  max,
}: {
  series: { data: number[]; color: string; dash?: string }[];
  labels?: string[];
  width: number;
  height: number;
  theme?: Theme;
  min?: number;
  max?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const s = surf(theme);
  const grid = theme === 'dark' ? '#1A1A1A' : '#EDEDED';
  const labelH = labels ? 14 : 0;
  const h = height - labelH;
  const all = series.flatMap((x) => x.data);
  const lo = min ?? Math.min(...all) * 0.92;
  const hi = max ?? Math.max(...all) * 1.06;
  const px = (i: number, n: number) => (i / (n - 1)) * width;
  const py = (v: number) => h - 4 - ((v - lo) / (hi - lo || 1)) * (h - 12);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        {series.map((x, i) => (
          <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={x.color} stopOpacity={0.1} />
            <stop offset="100%" stopColor={x.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2={width}
          y1={4 + (i * (h - 8)) / 3}
          y2={4 + (i * (h - 8)) / 3}
          stroke={grid}
          strokeWidth={1}
        />
      ))}
      {series.map((x, i) => {
        const pts = x.data.map((v, j) => [px(j, x.data.length), py(v)] as [number, number]);
        const d = smoothPath(pts);
        return (
          <g key={i}>
            {!x.dash ? (
              <path d={`${d} L${width},${h} L0,${h} Z`} fill={`url(#${uid}-g${i})`} />
            ) : null}
            <path d={d} fill="none" stroke={x.color} strokeWidth={2} strokeDasharray={x.dash} strokeLinecap="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.2} fill={x.color} />
          </g>
        );
      })}
      {labels
        ? labels.map((l, i) =>
            l ? (
              <text
                key={i}
                x={i === 0 ? 1 : i === labels.length - 1 ? width - 1 : px(i, labels.length)}
                y={height - 2}
                fontSize={9.5}
                textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
                fill={s.dim}
              >
                {l}
              </text>
            ) : null,
          )
        : null}
    </svg>
  );
}

/* ── Gauge ─────────────────────────────────────────────────────────── */

export function Gauge({
  value,
  max = 100,
  size = 86,
  theme = 'dark',
  color: c,
  caption,
  display,
}: {
  value: number;
  max?: number;
  size?: number;
  theme?: Theme;
  color: string;
  caption?: string;
  display?: string;
}) {
  const s = surf(theme);
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <div className="num" style={{ fontSize: size * 0.3, color: c }}>
          {display ?? value}
        </div>
        {caption ? (
          <div style={{ fontSize: 9, color: s.dim, letterSpacing: '-0.005em' }}>{caption}</div>
        ) : null}
      </div>
    </div>
  );
}
