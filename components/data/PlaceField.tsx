'use client';

/**
 * A place input with Nominatim autocomplete, shared by the route planner on the
 * home page and the route comparison on /routes.
 */

import React from 'react';
import type { Place } from '@/app/api/geocode/route';
import { color } from '@/lib/tokens';

export default function PlaceField({
  label,
  value,
  onChange,
  placeholder,
  dot,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dot: string;
}) {
  const [suggest, setSuggest] = React.useState<Place[]>([]);
  const [open, setOpen] = React.useState(false);

  // Nominatim asks for one request a second, so the field waits for a pause
  // in typing rather than firing on every keystroke.
  React.useEffect(() => {
    if (value.trim().length < 3) {
      setSuggest([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const body = await res.json();
        setSuggest(body.places ?? []);
      } catch {
        setSuggest([]);
      }
    }, 550);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <label style={{ flex: 1, minWidth: 210, position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="lbl" style={{ color: color.c.muted }}>
        {label}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          height: 38,
          borderRadius: 9,
          border: `1px solid ${color.c.border}`,
          background: '#FFF',
          padding: '0 11px',
        }}
      >
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: dot, flexShrink: 0 }} />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: 13,
            letterSpacing: '-0.011em',
            fontFamily: 'inherit',
            color: color.c.ink,
            background: 'transparent',
          }}
        />
      </span>

      {open && suggest.length ? (
        <ul
          style={{
            position: 'absolute',
            top: 66,
            left: 0,
            right: 0,
            zIndex: 500,
            listStyle: 'none',
            margin: 0,
            padding: 4,
            background: '#FFF',
            border: `1px solid ${color.c.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.09)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {suggest.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(p.label);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: '7px 8px',
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: color.c.ink,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderRadius: 7,
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
