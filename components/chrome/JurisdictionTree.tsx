'use client';

import React from 'react';
import { color } from '@/lib/tokens';
import { JURISDICTION } from '@/lib/fixtures/authorities';

export default function JurisdictionTree({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div>
      <div className="lbl" style={{ color: color.a.muted, marginBottom: 9 }}>
        Jurisdiction
      </div>
      <div>
        {JURISDICTION.map((n) => {
          const on = n.id === selected;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect?.(n.id)}
              aria-pressed={on}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: `4px 7px 4px ${7 + n.depth * 11}px`,
                borderRadius: 7,
                background: on ? '#1A1A1A' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                marginBottom: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: on ? color.mark : color.a.faint,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  letterSpacing: '-0.011em',
                  color: on ? color.a.ink : color.a.muted,
                  fontWeight: on ? 600 : 400,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.name}
              </span>
              <span className="mono" style={{ color: color.a.dim, fontSize: 11 }}>
                {n.count.toLocaleString('en-IN')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
