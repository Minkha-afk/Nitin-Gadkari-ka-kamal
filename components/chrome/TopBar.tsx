'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { color } from '@/lib/tokens';
import { Avatar } from '@/components/system';
import { IconBell, IconChevron } from './Icons';
import { useRole } from './RoleContext';
import { ROLES } from '@/lib/fixtures/authorities';

export default function TopBar({ crumbs }: { crumbs?: string[] }) {
  const { role, setRoleId } = useRole();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const trail = crumbs ?? (path === '/model' ? ['RoadSense', 'Model operations'] : role.breadcrumb);

  return (
    <header
      style={{
        height: 58,
        flexShrink: 0,
        background: '#000',
        borderBottom: `1px solid ${color.a.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {trail.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 ? <span style={{ color: color.a.faint }}>/</span> : null}
            <span
              style={{
                color: i === trail.length - 1 ? color.a.ink : color.a.muted,
                fontWeight: i === trail.length - 1 ? 500 : 400,
                letterSpacing: '-0.011em',
              }}
            >
              {c}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: '#111',
            border: `1px solid ${color.a.border}`,
            borderRadius: 9,
            padding: '5px 9px 5px 6px',
            color: color.a.ink,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Avatar initials={role.initials} />
          <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.011em' }}>
              {role.name}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: color.a.dim }}>{role.scope}</span>
          </span>
          <span style={{ color: color.a.dim, display: 'flex' }}>
            <IconChevron size={15} />
          </span>
        </button>

        {open ? (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 46,
              right: 44,
              width: 252,
              background: color.a.panel,
              border: `1px solid ${color.a.border}`,
              borderRadius: 10,
              padding: 5,
              zIndex: 40,
            }}
          >
            {ROLES.map((r) => (
              <button
                key={r.id}
                role="menuitemradio"
                aria-checked={r.id === role.id}
                type="button"
                onClick={() => {
                  setRoleId(r.id);
                  setOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 9px',
                  borderRadius: 8,
                  background: r.id === role.id ? '#1A1A1A' : 'transparent',
                  border: 'none',
                  color: color.a.ink,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{r.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: color.a.dim, marginTop: 2 }}>
                  {r.scope} · {r.queue} tickets
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          aria-label="Notifications"
          style={{
            background: 'transparent',
            border: 'none',
            color: color.a.muted,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <IconBell size={18} />
        </button>
      </div>
    </header>
  );
}
