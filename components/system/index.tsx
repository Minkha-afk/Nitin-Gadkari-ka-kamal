'use client';

import React, { createContext, useContext } from 'react';
import { chipTint, surf, toneColor, type Theme, type Tone } from '@/lib/tokens';

/* ── theme ─────────────────────────────────────────────────────────── */

const ThemeCtx = createContext<Theme>('dark');
export const useTheme = () => useContext(ThemeCtx);
export const ThemeProvider = ThemeCtx.Provider;

/* ── Panel ─────────────────────────────────────────────────────────── */

export function Panel({
  children,
  style,
  flush,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      className={className}
      style={{
        background: s.panel,
        border: `1px solid ${s.line}`,
        borderRadius: s.radius,
        overflow: flush ? 'hidden' : undefined,
        minWidth: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  sub,
  right,
  style,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      style={{
        padding: '15px 18px 13px',
        borderBottom: `1px solid ${s.lineSoft}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h2 className="h2" style={{ color: s.ink }}>
          {title}
        </h2>
        {sub ? (
          <div className="tiny" style={{ color: s.dim, marginTop: 3 }}>
            {sub}
          </div>
        ) : null}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

export function PanelBody({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ padding: 14, minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

/* ── Chip ──────────────────────────────────────────────────────────── */

export function Chip({
  children,
  tone = 'neutral',
  dot,
  style,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  style?: React.CSSProperties;
}) {
  const t = useTheme();
  const tint = chipTint[t][tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 23,
        padding: '0 9px',
        borderRadius: 7,
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        background: 'transparent',
        border: `1px solid ${tint.border}`,
        color: tint.ink,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: '50%', background: tint.ink }}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ── Btn ───────────────────────────────────────────────────────────── */

export function Btn({
  children,
  primary,
  small,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; small?: boolean }) {
  const t = useTheme();
  const dark = t === 'dark';
  const skin = primary
    ? dark
      ? { background: '#FAFAFA', border: '#FAFAFA', color: '#0A0A0A' }
      : { background: '#0A0A0A', border: '#0A0A0A', color: '#FFFFFF' }
    : dark
      ? { background: '#0F0F0F', border: '#262626', color: '#EDEDED' }
      : { background: '#FFFFFF', border: '#E6E6E6', color: '#0A0A0A' };
  return (
    <button
      type="button"
      style={{
        height: small ? 28 : 34,
        padding: small ? '0 10px' : '0 14px',
        borderRadius: 9,
        fontSize: small ? 12.5 : 13,
        fontWeight: 500,
        letterSpacing: '-0.011em',
        background: skin.background,
        border: `1px solid ${skin.border}`,
        color: skin.color,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Bar ───────────────────────────────────────────────────────────── */

export function Bar({
  value,
  tone = 'neutral',
  width,
  height = 4,
  color: raw,
  style,
}: {
  value: number; // 0–100
  tone?: Tone;
  width?: number | string;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      style={{
        width: width ?? '100%',
        height,
        borderRadius: 99,
        background: s.track,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          borderRadius: 99,
          background: raw ?? toneColor(tone, t),
        }}
      />
    </div>
  );
}

/* ── KpiTile ───────────────────────────────────────────────────────── */

export function KpiTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <Panel style={{ padding: '12px 14px' }}>
      <div className="sub" style={{ color: s.muted, fontSize: 11.5 }}>
        {label}
      </div>
      <div
        className="num"
        style={{ fontSize: 30, marginTop: 6, color: tone ? toneColor(tone, t) : s.ink }}
      >
        {value}
      </div>
      {sub ? (
        <div className="tiny" style={{ color: s.dim, marginTop: 6 }}>
          {sub}
        </div>
      ) : null}
    </Panel>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rs-kpi"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}
    >
      {children}
    </div>
  );
}

/* ── SlaPlate ──────────────────────────────────────────────────────── */

export function SlaPlate({
  value,
  unit,
  tone = 'neutral',
}: {
  value: React.ReactNode;
  unit: string;
  tone?: Tone;
}) {
  const t = useTheme();
  const c = toneColor(tone, t);
  return (
    <div
      style={{
        border: `1px solid ${c}`,
        color: c,
        borderRadius: 9,
        padding: '7px 10px',
        minWidth: 64,
        background: 'transparent',
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      <div className="num" style={{ fontSize: 20 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          textTransform: 'lowercase',
          opacity: 0.72,
          marginTop: 2,
          letterSpacing: '-0.005em',
        }}
      >
        {unit}
      </div>
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────────────────── */

export function Avatar({ initials, size = 26 }: { initials: string; size?: number }) {
  const t = useTheme();
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: t === 'dark' ? '#1C1C1C' : '#F2F2F2',
        color: t === 'dark' ? '#EDEDED' : '#0A0A0A',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size < 24 ? 10 : 11,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

/* ── Stat ──────────────────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  sub,
  tone,
  size = 22,
}: {
  label?: string;
  value: React.ReactNode;
  sub?: string;
  tone?: Tone;
  size?: number;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div style={{ minWidth: 0 }}>
      {label ? (
        <div className="lbl" style={{ color: s.muted }}>
          {label}
        </div>
      ) : null}
      <div
        className="num"
        style={{ fontSize: size, marginTop: 5, color: tone ? toneColor(tone, t) : s.ink }}
      >
        {value}
      </div>
      {sub ? (
        <div className="tiny" style={{ color: s.dim, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/* ── small helpers ─────────────────────────────────────────────────── */

export function Dot({ tone, size = 8 }: { tone: Tone; size?: number }) {
  const t = useTheme();
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: toneColor(tone, t),
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

export function Inset({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      style={{
        background: s.inset,
        border: `1px solid ${s.lineSoft}`,
        borderRadius: 10,
        padding: '11px 12px',
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  style,
  divider,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { divider?: boolean }) {
  const t = useTheme();
  const s = surf(t);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 0',
        borderBottom: divider ? `1px solid ${s.lineSoft}` : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
