'use client';

/**
 * CSV export for the console.
 *
 * Plain anchors, not fetch-and-blob: the browser streams the file straight from
 * the endpoint, which keeps a twenty-thousand-row export out of the tab's
 * memory and makes the download resumable.
 *
 * Tickets follow whatever jurisdiction is selected, so the file matches the
 * screen it was asked for. The others are the whole database.
 */

import React from 'react';
import { Btn } from '@/components/system';
import { IconDownload } from '@/components/chrome/Icons';
import { color } from '@/lib/tokens';

const EXPORTS = [
  { kind: 'tickets', label: 'Tickets', note: 'this jurisdiction, with how long each has been open' },
  { kind: 'defects', label: 'Detections', note: 'every stored defect, with coordinates' },
  { kind: 'events', label: 'Audit trail', note: 'every change, with hashes' },
  { kind: 'uploads', label: 'Uploads', note: 'one row per analysed file' },
];

export default function ExportMenu({ scopeLabel }: { scopeLabel?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <Btn onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <IconDownload size={14} />
        Export CSV
      </Btn>

      {open ? (
        <>
          {/* click-away */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 39 }}
            aria-hidden
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 40,
              right: 0,
              width: 286,
              background: color.a.panel,
              border: `1px solid ${color.a.border}`,
              borderRadius: 12,
              padding: 6,
              zIndex: 40,
              boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            }}
          >
            {EXPORTS.map((e) => (
              <a
                key={e.kind}
                role="menuitem"
                href={`/api/export/${e.kind}.csv`}
                download
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '9px 10px',
                  borderRadius: 9,
                  textDecoration: 'none',
                  color: color.a.ink,
                }}
              >
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{e.label}</span>
                <span className="tiny" style={{ display: 'block', color: color.a.dim, marginTop: 2 }}>
                  {e.kind === 'tickets' && scopeLabel ? `${scopeLabel} · with how long each has been open` : e.note}
                </span>
              </a>
            ))}

            <div style={{ borderTop: `1px solid ${color.a.line}`, margin: '5px 0 0', paddingTop: 5 }}>
              <a
                role="menuitem"
                href="/api/export/tickets.csv?scope=all"
                download
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '9px 10px',
                  borderRadius: 9,
                  textDecoration: 'none',
                  color: color.a.ink2,
                  fontSize: 12.5,
                }}
              >
                Tickets — every jurisdiction
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
