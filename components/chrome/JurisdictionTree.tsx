'use client';

/** The registered jurisdictions, with open counts rolled up from children. */

import React from 'react';
import { useScope } from './ScopeContext';
import { color } from '@/lib/tokens';

export default function JurisdictionTree() {
  const { tree, scope, setScope } = useScope();

  if (!tree.nodes.length) {
    return (
      <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
        No authorities registered yet. Until one is, every ticket is unassigned — register a jurisdiction
        with <span className="mono">POST /api/authorities</span> and anything inside its boundary routes
        there on arrival.
      </p>
    );
  }

  return (
    <div>
      {tree.nodes.map((n) => {
        const active = scope === n.id;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => setScope(n.id)}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              gap: 8,
              padding: '7px 8px',
              paddingLeft: 8 + n.depth * 14,
              borderRadius: 7,
              background: active ? '#1A1A1A' : 'transparent',
              border: 'none',
              color: active ? color.a.ink : color.a.ink2,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, letterSpacing: '-0.011em' }}>{n.name}</span>
            <span className="mono" style={{ color: color.a.dim }}>
              {n.openCount}
            </span>
          </button>
        );
      })}
      {tree.unassignedOpen ? (
        <button
          type="button"
          onClick={() => setScope('unassigned')}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 8,
            padding: '7px 8px',
            marginTop: 4,
            borderTop: `1px solid ${color.a.line}`,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            background: scope === 'unassigned' ? '#1A1A1A' : 'transparent',
            color: color.amber,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ flex: 1, fontSize: 12.5 }}>Unassigned</span>
          <span className="mono">{tree.unassignedOpen}</span>
        </button>
      ) : null}
    </div>
  );
}
