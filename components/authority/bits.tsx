'use client';

/** Shared pieces across the authority screens. */

import React from 'react';
import Link from 'next/link';
import { Chip } from '@/components/system';
import type { TicketRow } from '@/lib/authority';
import { color, severityTone, toneColor, type Tone } from '@/lib/tokens';
import { CLASS_LABEL, type TicketState } from '@/lib/types';

export const STATE_TONE: Record<TicketState, Tone> = {
  new: 'brand',
  acknowledged: 'blue',
  assigned: 'blue',
  repaired: 'amber',
  verified: 'green',
  closed: 'green',
  reopened: 'red',
};

export const STATE_LABEL: Record<TicketState, string> = {
  new: 'New',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  repaired: 'Repaired',
  verified: 'Verified',
  closed: 'Closed',
  reopened: 'Reopened',
};

export const LEVEL_LABEL: Record<string, string> = {
  ward_engineer: 'Ward engineer',
  executive_engineer: 'Executive engineer',
  commissioner: 'Commissioner',
  state_department: 'State department',
  public: 'Public',
};

export function slaTone(row: TicketRow): Tone {
  if (row.daysOver != null) return 'red';
  if (row.daysLeft != null && row.daysLeft <= 2) return 'amber';
  return 'neutral';
}

export function SlaCell({ row }: { row: TicketRow }) {
  const tone = slaTone(row);
  const text =
    row.daysOver != null
      ? `${row.daysOver} d over`
      : row.daysLeft != null
        ? `${row.daysLeft} d left`
        : 'settled';
  return (
    <span className="num" style={{ fontSize: 13, color: toneColor(tone, 'dark') }}>
      {text}
    </span>
  );
}

export const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 9px',
  borderBottom: `1px solid ${color.a.line}`,
  position: 'sticky',
  top: 0,
  background: color.a.panel,
};

export const TD: React.CSSProperties = {
  padding: '9px 10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink,
  verticalAlign: 'middle',
};

/** The queue table, shared by the ticket queue, escalations and verification. */
export function TicketTable({
  rows,
  emptyNote,
  showLevel = true,
}: {
  rows: TicketRow[];
  emptyNote: React.ReactNode;
  showLevel?: boolean;
}) {
  if (!rows.length) {
    return (
      <div style={{ padding: '22px 16px', color: color.a.muted, fontSize: 13, lineHeight: 1.6 }}>{emptyNote}</div>
    );
  }
  return (
    <div style={{ padding: '10px 12px 6px' }}>
      <table>
        <thead>
          <tr>
            <th scope="col" style={{ ...TH, width: 62 }}>Evidence</th>
            <th scope="col" style={TH}>Ticket</th>
            <th scope="col" style={TH}>Where</th>
            <th scope="col" style={TH}>State</th>
            {showLevel ? <th scope="col" style={{ ...TH }} className="rs-drop-1">Sitting with</th> : null}
            <th scope="col" style={{ ...TH, textAlign: 'right' }}>Passes</th>
            <th scope="col" style={{ ...TH, textAlign: 'right' }}>SLA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={TD}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.imageUrl}
                  alt=""
                  style={{
                    width: 50,
                    height: 33,
                    objectFit: 'cover',
                    borderRadius: 5,
                    border: `1px solid ${color.a.line}`,
                    background: color.a.inset,
                  }}
                />
              </td>
              <td style={TD}>
                <Link href={`/tickets/${r.id}`} className="mono" style={{ color: color.a.ink, textDecoration: 'none' }}>
                  {r.id}
                </Link>
                <div className="tiny" style={{ color: color.a.dim, marginTop: 3 }}>
                  {CLASS_LABEL[r.damageClass] ?? r.damageClass}
                </div>
              </td>
              <td style={TD}>
                <div style={{ fontWeight: 500, fontSize: 12.5 }}>{r.address ?? 'location not resolved'}</div>
                <div className="tiny" style={{ color: color.a.dim, marginTop: 3 }}>
                  {r.severityLabel} · {(r.confidence * 100).toFixed(0)}% confidence
                  {r.escalationCount ? ` · escalated ${r.escalationCount}×` : ''}
                </div>
              </td>
              <td style={TD}>
                <Chip tone={STATE_TONE[r.state]}>{STATE_LABEL[r.state]}</Chip>
              </td>
              {showLevel ? (
                <td style={TD} className="rs-drop-1">
                  <span className="tiny" style={{ color: color.a.ink2 }}>
                    {LEVEL_LABEL[r.level] ?? r.level}
                  </span>
                </td>
              ) : null}
              <td style={{ ...TD, textAlign: 'right' }}>
                <span className="num" style={{ fontSize: 13 }}>{r.passes}</span>
              </td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <SlaCell row={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SeverityChip({ severity, label }: { severity: TicketRow['severity']; label?: string }) {
  return <Chip tone={severityTone[severity]}>{label ?? severity}</Chip>;
}

export function NotConfigured() {
  return (
    <div
      style={{
        border: `1px solid ${color.a.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        color: color.a.muted,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      No road database connected. Set <span className="mono">MONGODB_URI</span> in .env.local — every
      screen here reads live tickets, so there is nothing to show until it points somewhere.
    </div>
  );
}
