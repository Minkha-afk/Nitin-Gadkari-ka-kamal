'use client';

/**
 * The citizen-side kit.
 *
 * Deliberately not the same vocabulary as components/system, which dresses the
 * authority console — that is an instrument panel and should stay dense. This
 * side is a consumer product: fewer elements, much bigger, photographs doing
 * the talking.
 */

import React from 'react';
import Link from 'next/link';
import type { Severity } from '@/lib/types';

/* ── severity ─────────────────────────────────────────────────────────
   One accent per severity, used everywhere without exception, so the
   colour itself carries meaning before any label is read. */

export const SEV: Record<Severity, { ink: string; wash: string; label: string }> = {
  critical: { ink: '#D92D20', wash: '#FEF0EF', label: 'Critical' },
  high: { ink: '#B54708', wash: '#FEF3E6', label: 'Severe' },
  medium: { ink: '#96690A', wash: '#FEF8E7', label: 'Moderate' },
  low: { ink: '#175CD3', wash: '#EFF5FE', label: 'Minor' },
  good: { ink: '#067647', wash: '#ECFAF3', label: 'Clear' },
};

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="eyebrow" style={style}>
      {children}
    </span>
  );
}

/** Section heading: a mono kicker, a big line, and an optional action. */
export function SectionHead({
  kicker,
  title,
  sub,
  action,
  onInk,
}: {
  kicker?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  onInk?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {kicker ? (
          <Eyebrow style={onInk ? { color: 'rgba(247,245,242,0.5)' } : undefined}>{kicker}</Eyebrow>
        ) : null}
        <h2 className="display-sm" style={{ marginTop: kicker ? 12 : 0, color: onInk ? '#F7F5F2' : 'var(--ink)' }}>
          {title}
        </h2>
        {sub ? (
          <p className="copy" style={{ marginTop: 10, color: onInk ? 'rgba(247,245,242,0.62)' : 'var(--ink-2)' }}>
            {sub}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** A number that is allowed to be enormous. */
export function Figure({
  value,
  label,
  tint,
  onInk,
}: {
  value: React.ReactNode;
  label: string;
  tint?: string;
  onInk?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="figure" style={{ color: tint ?? (onInk ? '#F7F5F2' : 'var(--ink)') }}>
        {value}
      </div>
      <div
        className="eyebrow"
        style={{ display: 'block', marginTop: 12, color: onInk ? 'rgba(247,245,242,0.45)' : 'var(--ink-3)' }}
      >
        {label}
      </div>
    </div>
  );
}

export function Pill({
  children,
  variant = 'solid',
  size,
  href,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'mark' | 'ghost' | 'onInk';
  size?: 'sm';
  href?: string;
}) {
  const cls = `pill pill-${variant === 'onInk' ? 'on-ink' : variant}${size === 'sm' ? ' pill-sm' : ''}`;
  if (href) {
    return (
      <Link href={href} className={cls} style={{ textDecoration: 'none' }}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/** Severity badge. Small, solid, unmissable — the one loud element. */
export function SevBadge({ severity, children }: { severity: Severity; children?: React.ReactNode }) {
  const s = SEV[severity];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 26,
        padding: '0 11px',
        borderRadius: 999,
        background: s.wash,
        color: s.ink,
        fontSize: 11.5,
        fontWeight: 650,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.ink }} />
      {children ?? s.label}
    </span>
  );
}

/** The same badge for use over a photograph. */
export function SevBadgeOnShot({ severity, children }: { severity: Severity; children?: React.ReactNode }) {
  const s = SEV[severity];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 26,
        padding: '0 11px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.94)',
        color: s.ink,
        fontSize: 11.5,
        fontWeight: 650,
        backdropFilter: 'blur(6px)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.ink }} />
      {children ?? s.label}
    </span>
  );
}

/** Photograph with an optional badge and caption sitting on it. */
export function Shot({
  src,
  alt = '',
  ratio = '4 / 3',
  badge,
  caption,
  radius = 16,
}: {
  src: string;
  alt?: string;
  ratio?: string;
  badge?: React.ReactNode;
  caption?: React.ReactNode;
  radius?: number;
}) {
  return (
    <div className={`shot${caption ? ' shot-wash' : ''}`} style={{ aspectRatio: ratio, borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      {badge ? <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>{badge}</div> : null}
      {caption ? (
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, zIndex: 2, color: '#fff' }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
}

/** Empty states get the same care as full ones — most demos start empty. */
export function Empty({
  kicker,
  title,
  body,
  action,
}: {
  kicker?: string;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '54px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
      }}
    >
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h3 className="display-sm" style={{ maxWidth: '18ch' }}>
        {title}
      </h3>
      <p className="copy" style={{ maxWidth: '46ch' }}>
        {body}
      </p>
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}

export function Divider({ onInk }: { onInk?: boolean }) {
  return (
    <div
      style={{
        height: 1,
        background: onInk ? 'rgba(255,255,255,0.1)' : 'var(--hairline)',
      }}
    />
  );
}

export function ago(iso: string | null | undefined) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 172_800) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86_400)} d ago`;
}
