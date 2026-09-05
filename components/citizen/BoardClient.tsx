'use client';

import React from 'react';
import Link from 'next/link';
import { Bar, Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import type { BoardRow } from '@/lib/authority';
import { color, toneColor } from '@/lib/tokens';

const LEVEL_LABEL: Record<string, string> = {
  ward_engineer: 'Ward',
  executive_engineer: 'Zone',
  commissioner: 'City',
  state_department: 'State',
  public: 'Public',
};

const TH: React.CSSProperties = {
  color: color.c.muted,
  padding: '0 10px 9px',
  borderBottom: `1px solid ${color.c.line}`,
};
const TD: React.CSSProperties = {
  padding: '11px 10px',
  borderBottom: '1px solid #F5F5F5',
  color: color.c.ink,
  verticalAlign: 'middle',
};

export default function BoardClient({
  rows,
  unassigned,
  configured,
}: {
  rows: BoardRow[];
  unassigned: number;
  configured: boolean;
}) {
  const totals = rows.reduce(
    (a, r) => ({
      open: a.open + r.open,
      breached: a.breached + r.breached,
      fixed: a.fixed + r.fixed,
      reopened: a.reopened + r.reopened,
    }),
    { open: 0, breached: 0, fixed: 0, reopened: 0 },
  );
  const worstOpen = Math.max(1, ...rows.map((r) => r.open));

  return (
    <div className="scrollarea" style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="h1">Who is fixing what</h1>
          <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
            Every authority that owns tickets here, and how they are doing against their own deadlines.
          </p>
        </div>
        <Link href="/upload">
          <Btn primary>Send in a road</Btn>
        </Link>
      </div>

      {!configured ? (
        <Panel style={{ padding: '12px 15px', borderColor: '#FAE7C6', background: '#FFFCF5' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#B45E09' }}>No road database connected</div>
        </Panel>
      ) : null}

      {rows.length ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[
              [String(rows.length), 'authorities with tickets', undefined],
              [String(totals.open), 'open right now', undefined],
              [String(totals.breached), 'past their deadline', totals.breached ? color.red : undefined],
              [String(totals.fixed), 'verified fixed', totals.fixed ? color.green : undefined],
              [String(totals.reopened), 'came back after repair', totals.reopened ? color.red : undefined],
            ].map(([v, l, c]) => (
              <Panel key={l as string} style={{ padding: '12px 14px' }}>
                <div className="num" style={{ fontSize: 26, color: (c as string) ?? color.c.ink }}>{v}</div>
                <div className="tiny" style={{ color: color.c.muted, marginTop: 6 }}>{l}</div>
              </Panel>
            ))}
          </div>

          <Panel flush>
            <PanelHead title="By authority" sub="Most breached deadlines first" />
            <div style={{ padding: '12px 12px 6px' }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col" style={TH}>Authority</th>
                    <th scope="col" style={TH}>Open work</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Past deadline</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Fixed</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Came back</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Median days</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={TD}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                        <div className="tiny" style={{ color: color.c.muted, marginTop: 3 }}>
                          {LEVEL_LABEL[r.level] ?? r.level}
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Bar value={(r.open / worstOpen) * 100} width={110} color={color.c.ink} />
                          <span className="num" style={{ fontSize: 14 }}>{r.open}</span>
                        </div>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        {r.breached ? <Chip tone="red">{r.breached}</Chip> : <span className="mono" style={{ color: color.c.dim }}>0</span>}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', color: r.fixed ? toneColor('green', 'light') : undefined }}>
                        <span className="num" style={{ fontSize: 14 }}>{r.fixed}</span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        {r.reopened ? <Chip tone="red">{r.reopened}</Chip> : <span className="mono" style={{ color: color.c.dim }}>0</span>}
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <span className="mono">{r.medianFixDays ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : (
        <Panel>
          <PanelHead title="No authorities registered yet" />
          <PanelBody>
            <p className="sub" style={{ color: color.c.muted, lineHeight: 1.6 }}>
              This board ranks the offices that own road repairs. None have been registered, so every
              ticket raised so far is unassigned — {unassigned} of them right now.
            </p>
            <Inset style={{ marginTop: 12 }}>
              <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.6, margin: 0 }}>
                An authority is a real organisation with a real jurisdiction, so nothing is seeded here.
                Register one with a GeoJSON boundary and every ticket inside it routes there on arrival,
                with its own deadlines and its own row on this board.
              </p>
            </Inset>
          </PanelBody>
        </Panel>
      )}

      {unassigned && rows.length ? (
        <Inset>
          <span className="tiny" style={{ color: color.c.muted, lineHeight: 1.6 }}>
            {unassigned} open ticket{unassigned === 1 ? '' : 's'} sit outside every registered jurisdiction,
            so nobody owns them yet.
          </span>
        </Inset>
      ) : null}
    </div>
  );
}
