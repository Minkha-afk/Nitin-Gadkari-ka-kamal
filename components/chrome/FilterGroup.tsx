'use client';

import React from 'react';
import { color } from '@/lib/tokens';

export interface FilterItem {
  id: string;
  label: string;
  count: number;
}

export default function FilterGroup({
  title,
  items,
  checked,
  onToggle,
}: {
  title: string;
  items: FilterItem[];
  checked: Record<string, boolean>;
  onToggle?: (id: string) => void;
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="lbl" style={{ color: color.a.muted, marginBottom: 9, padding: 0 }}>
        {title}
      </legend>
      {items.map((it) => {
        const on = !!checked[it.id];
        return (
          <label
            key={it.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '4px 0',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle?.(it.id)}
              style={{ position: 'absolute', opacity: 0, width: 14, height: 14, margin: 0 }}
            />
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                flexShrink: 0,
                background: on ? '#FAFAFA' : 'transparent',
                border: on ? '1px solid #FAFAFA' : '1px solid #39424A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="m2.5 6.2 2.4 2.4L9.6 3.9" stroke="#0A0A0A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
            <span
              style={{
                fontSize: 12.5,
                letterSpacing: '-0.011em',
                color: on ? color.a.ink : color.a.muted,
                flex: 1,
              }}
            >
              {it.label}
            </span>
            <span className="mono" style={{ color: color.a.dim, fontSize: 11 }}>
              {it.count}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** Small helper for the common "all on by default" filter state. */
export function useFilterState(defaults: string[]) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(defaults.map((d) => [d, true])),
  );
  const toggle = React.useCallback(
    (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] })),
    [],
  );
  return { checked, toggle };
}
