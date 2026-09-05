'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';
import { Avatar } from '@/components/system';
import { color } from '@/lib/tokens';
import { IconBell, IconSearch } from './Icons';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/drive', label: 'Drive' },
  { href: '/upload', label: 'Upload' },
  { href: '/routes', label: 'Routes' },
  { href: '/reports', label: 'My reports' },
  { href: '/board', label: 'Ward board' },
];

export default function TopNav() {
  const path = usePathname();
  return (
    <header
      style={{
        height: 60,
        flexShrink: 0,
        background: '#FFF',
        borderBottom: `1px solid ${color.c.line}`,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: '0 28px',
      }}
    >
      <Link href="/" aria-label="RoadSense home">
        <Brand theme="light" />
      </Link>
      <nav aria-label="Main" style={{ display: 'flex', alignItems: 'center', gap: 22, height: '100%' }}>
        {NAV.map((n) => {
          const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              style={{
                fontSize: 13.5,
                letterSpacing: '-0.011em',
                fontWeight: active ? 600 : 500,
                color: active ? color.c.ink : color.c.muted,
                textDecoration: 'none',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                borderBottom: active ? '2px solid #0A0A0A' : '2px solid transparent',
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 230,
          height: 34,
          borderRadius: 9,
          background: color.c.inset,
          border: `1px solid ${color.c.line}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 11px',
          color: color.c.dim,
        }}
      >
        <IconSearch size={15} />
        <span style={{ fontSize: 12.5, letterSpacing: '-0.011em' }}>Search a road or locality</span>
      </div>
      <button
        type="button"
        aria-label="Notifications, 1 unread"
        style={{
          background: 'transparent',
          border: 'none',
          color: color.c.muted,
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
        }}
      >
        <IconBell size={18} />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -1,
            right: -1,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color.red,
          }}
        />
      </button>
      <Avatar initials="AB" />
    </header>
  );
}
