'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LaneGlyph } from './Brand';
import { Avatar } from '@/components/system';
import { color } from '@/lib/tokens';
import {
  IconCheck,
  IconCloud,
  IconGear,
  IconGrid,
  IconList,
  IconMap,
  IconUp,
  IconWrench,
} from './Icons';

const TOP = [
  { href: '/console', label: 'Command centre', Icon: IconMap },
  { href: '/tickets', label: 'Ticket queue', Icon: IconList },
  { href: '/verification', label: 'Verification queue', Icon: IconCheck },
  { href: '/escalations', label: 'Escalation ladder', Icon: IconUp },
];
const BOTTOM = [
  { href: '/forecast', label: 'Predictive maintenance', Icon: IconCloud },
  { href: '/contractors', label: 'Contractors and work orders', Icon: IconWrench },
  { href: '/model', label: 'Detection quality', Icon: IconGrid },
];

export default function Rail() {
  const path = usePathname();
  const item = (href: string, label: string, Icon: (p: { size?: number }) => React.JSX.Element) => {
    const active = path === href || path.startsWith(href + '/');
    return (
      <Link
        key={href}
        href={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        title={label}
        style={{
          width: 38,
          height: 36,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? '#161616' : 'transparent',
          color: active ? '#FAFAFA' : color.a.dim,
        }}
      >
        <Icon size={19} />
      </Link>
    );
  };

  return (
    <nav
      aria-label="Sections"
      style={{
        width: 64,
        flexShrink: 0,
        background: '#000',
        borderRight: `1px solid ${color.a.line}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0 14px',
        gap: 6,
      }}
    >
      <Link href="/console" aria-label="HappyJourney" style={{ marginBottom: 10 }}>
        <LaneGlyph size={26} />
      </Link>
      {TOP.map((x) => item(x.href, x.label, x.Icon))}
      <div style={{ width: 24, height: 1, background: color.a.line, margin: '7px 0' }} />
      {BOTTOM.map((x) => item(x.href, x.label, x.Icon))}
      <div style={{ flex: 1 }} />
      <button
        type="button"
        aria-label="Settings"
        style={{
          width: 38,
          height: 36,
          borderRadius: 9,
          background: 'transparent',
          border: 'none',
          color: color.a.dim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IconGear size={19} />
      </button>
      <Avatar initials="RB" />
    </nav>
  );
}
