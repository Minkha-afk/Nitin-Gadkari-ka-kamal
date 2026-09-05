'use client';

/**
 * A place input with Nominatim autocomplete.
 *
 * Two tones: on paper for the routes page, on ink for the home hero. The dark
 * variant is not a filter over the light one — placeholder, border and menu
 * colours are all set for the surface they sit on, because a washed-out grey
 * placeholder on black is the single clearest sign of a theme done carelessly.
 */

import React from 'react';
import type { Place } from '@/app/api/geocode/route';

export default function PlaceField({
  label,
  value,
  onChange,
  placeholder,
  dot,
  tone = 'paper',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dot: string;
  tone?: 'paper' | 'ink';
}) {
  const [suggest, setSuggest] = React.useState<Place[]>([]);
  const [open, setOpen] = React.useState(false);
  const onInk = tone === 'ink';

  // Nominatim asks for one request a second, so the field waits for a pause in
  // typing rather than firing on every keystroke.
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
    <label style={{ flex: 1, minWidth: 200, position: 'relative', display: 'block' }}>
      <span
        className="eyebrow"
        style={{ display: 'block', marginBottom: 9, color: onInk ? 'rgba(247,245,242,0.45)' : 'var(--ink-3)' }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          height: 54,
          borderRadius: 14,
          border: `1px solid ${onInk ? 'rgba(255,255,255,0.14)' : 'var(--hairline)'}`,
          background: onInk ? 'rgba(255,255,255,0.06)' : '#fff',
          padding: '0 16px',
          transition: 'border-color 0.2s var(--ease)',
        }}
      >
        <span aria-hidden style={{ width: 9, height: 9, borderRadius: 3, background: dot, flexShrink: 0 }} />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: 15.5,
            letterSpacing: '-0.014em',
            fontFamily: 'inherit',
            fontWeight: 500,
            color: onInk ? '#F7F5F2' : 'var(--ink)',
            background: 'transparent',
          }}
        />
      </span>

      {open && suggest.length ? (
        <ul
          style={{
            position: 'absolute',
            top: 86,
            left: 0,
            right: 0,
            zIndex: 500,
            listStyle: 'none',
            margin: 0,
            padding: 6,
            background: onInk ? '#17150F' : '#fff',
            border: `1px solid ${onInk ? 'rgba(255,255,255,0.12)' : 'var(--hairline)'}`,
            borderRadius: 14,
            boxShadow: '0 18px 48px rgba(12, 9, 4, 0.22)',
            maxHeight: 250,
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
                  padding: '10px 11px',
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  color: onInk ? 'rgba(247,245,242,0.86)' : 'var(--ink-2)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderRadius: 10,
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
