'use client';

/**
 * Citizen navigation.
 *
 * Desktop: a slim sticky bar that blurs the page behind it, with the active
 * item marked by a filled pill rather than an underline — closer to how a
 * shopping app marks a tab than how a dashboard marks a route.
 *
 * Mobile: the bar keeps only the wordmark and the primary action, and the
 * sections move to a bottom tab bar where a thumb can reach them.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';
import { IconCar, IconList, IconMap, IconShield, IconUp } from './Icons';

const NAV = [
  { href: '/', label: 'Home', Icon: IconMap },
  { href: '/routes', label: 'Routes', Icon: IconCar },
  { href: '/upload', label: 'Upload', Icon: IconUp },
  { href: '/reports', label: 'Reports', Icon: IconList },
  { href: '/board', label: 'Board', Icon: IconShield },
];

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

export default function TopNav() {
  const path = usePathname();

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          flexShrink: 0,
          background: 'rgba(250, 249, 247, 0.82)',
          backdropFilter: 'saturate(150%) blur(14px)',
          WebkitBackdropFilter: 'saturate(150%) blur(14px)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <div
          className="shell"
          style={{ height: 66, display: 'flex', alignItems: 'center', gap: 26 }}
        >
          <Link href="/" aria-label="HappyJourney home" style={{ display: 'flex' }}>
            <Brand theme="light" />
          </Link>

          <nav aria-label="Main" className="hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV.filter((n) => n.href !== '/upload').map((n) => {
              const active = isActive(path, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    height: 36,
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: active ? 650 : 500,
                    letterSpacing: '-0.014em',
                    textDecoration: 'none',
                    color: active ? '#fff' : 'var(--ink-2)',
                    background: active ? 'var(--ink)' : 'transparent',
                    transition: 'background 0.22s var(--ease), color 0.22s var(--ease)',
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <span style={{ flex: 1 }} />

          <Link
            href="/upload"
            className="pill pill-mark pill-sm"
            style={{ textDecoration: 'none' }}
          >
            <IconUp size={14} />
            Send a road
          </Link>
        </div>
      </header>

      {/* thumb-reach tabs */}
      <nav
        aria-label="Sections"
        className="only-sm"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 70,
          background: 'rgba(250, 249, 247, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          padding: '8px 6px calc(8px + env(safe-area-inset-bottom))',
        }}
      >
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 0',
                textDecoration: 'none',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
              }}
            >
              <n.Icon size={19} />
              <span style={{ fontSize: 10, fontWeight: active ? 650 : 500, letterSpacing: '-0.005em' }}>
                {n.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
