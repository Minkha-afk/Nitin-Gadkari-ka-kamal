'use client';

import React, { useState } from 'react';
import { color } from '@/lib/tokens';
import { Avatar } from '@/components/system';
import { IconBell, IconChevron } from './Icons';
import { useScope } from './ScopeContext';

const LEVEL_LABEL: Record<string, string> = {
  ward_engineer: 'Ward engineer',
  executive_engineer: 'Executive engineer',
  commissioner: 'Commissioner',
  state_department: 'State department',
  public: 'Public',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function TopBar({ crumbs }: { crumbs?: string[] }) {
  const { tree, scope, scopeLabel, setScope } = useScope();
  const [open, setOpen] = useState(false);

  const current = tree.nodes.find((n) => n.id === scope) ?? null;
  const trail = crumbs ?? buildTrail(tree.nodes, scope, scopeLabel);

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
          <React.Fragment key={`${c}-${i}`}>
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
          <Avatar initials={current ? initials(current.name) : 'ALL'} />
          <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.011em' }}>
              {current ? LEVEL_LABEL[current.level] ?? current.level : 'All jurisdictions'}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: color.a.dim }}>{scopeLabel}</span>
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
              width: 288,
              background: color.a.panel,
              border: `1px solid ${color.a.border}`,
              borderRadius: 10,
              padding: 5,
              zIndex: 40,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            <Option
              label="All jurisdictions"
              sub={`${tree.totalOpen} open`}
              active={!scope || scope === 'all'}
              onPick={() => {
                setScope('all');
                setOpen(false);
              }}
            />
            {tree.nodes.map((n) => (
              <Option
                key={n.id}
                label={n.name}
                sub={`${LEVEL_LABEL[n.level] ?? n.level} · ${n.openCount} open`}
                depth={n.depth}
                active={scope === n.id}
                onPick={() => {
                  setScope(n.id);
                  setOpen(false);
                }}
              />
            ))}
            <Option
              label="Unassigned"
              sub={`${tree.unassignedOpen} open · no jurisdiction covers them`}
              active={scope === 'unassigned'}
              onPick={() => {
                setScope('unassigned');
                setOpen(false);
              }}
            />
            {!tree.nodes.length ? (
              <div style={{ padding: '9px 10px', fontSize: 11, color: color.a.dim, lineHeight: 1.5 }}>
                No authorities registered. POST one to /api/authorities with a GeoJSON jurisdiction and
                tickets inside it will route there automatically.
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          aria-label="Notifications"
          style={{ background: 'transparent', border: 'none', color: color.a.muted, cursor: 'pointer', display: 'flex' }}
        >
          <IconBell size={18} />
        </button>
      </div>
    </header>
  );
}

function Option({
  label,
  sub,
  active,
  depth = 0,
  onPick,
}: {
  label: string;
  sub: string;
  active: boolean;
  depth?: number;
  onPick: () => void;
}) {
  return (
    <button
      role="menuitemradio"
      aria-checked={active}
      type="button"
      onClick={onPick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 9px',
        paddingLeft: 9 + depth * 12,
        borderRadius: 8,
        background: active ? '#1A1A1A' : 'transparent',
        border: 'none',
        color: color.a.ink,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      <span style={{ display: 'block', fontSize: 11, color: color.a.dim, marginTop: 2 }}>{sub}</span>
    </button>
  );
}

function buildTrail(nodes: { id: string; name: string; parentId: string | null }[], scope: string | null, label: string) {
  if (!scope || scope === 'all') return ['HappyJourney', 'All jurisdictions'];
  if (scope === 'unassigned') return ['HappyJourney', 'Unassigned'];
  const trail: string[] = [];
  let cur = nodes.find((n) => n.id === scope);
  while (cur) {
    trail.unshift(cur.name);
    cur = cur.parentId ? nodes.find((n) => n.id === cur!.parentId) : undefined;
  }
  return trail.length ? trail : ['HappyJourney', label];
}
