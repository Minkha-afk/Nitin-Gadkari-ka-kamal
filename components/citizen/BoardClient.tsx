'use client';

/**
 * The board.
 *
 * A league table, so it should read like one: rank, name, and the single
 * number that decides the ranking, at a size you can read across a room.
 * Breached deadlines lead, because that is the number an office would rather
 * you did not see.
 */

import React from 'react';
import { Empty, Eyebrow, Figure, Pill, SectionHead, SEV } from './ui';
import type { BoardRow } from '@/lib/authority';

const LEVEL_LABEL: Record<string, string> = {
  ward_engineer: 'Municipal',
  executive_engineer: 'State works',
  commissioner: 'National highways',
  state_department: 'Ministry',
  public: 'Public',
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

  return (
    <div className="stack-xl" style={{ paddingTop: 48 }}>
      <section className="shell">
        <Eyebrow>Accountability</Eyebrow>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '14ch' }}>
          Who is fixing what.
        </h1>
        <p className="lede" style={{ marginTop: 18 }}>
          Every office that owns road repairs here, measured against deadlines they are held to — not
          against their own account of how it is going.
        </p>
      </section>

      {!configured ? (
        <section className="shell">
          <Empty kicker="Offline" title="No road database connected" body="Set MONGODB_URI in .env.local." />
        </section>
      ) : null}

      {rows.length ? (
        <>
          <section className="shell">
            <div className="ink-panel" style={{ padding: 'clamp(26px, 3.4vw, 46px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 30 }}>
                <Figure value={totals.open} label="open right now" onInk />
                <Figure
                  value={totals.breached}
                  label="past deadline"
                  onInk
                  tint={totals.breached ? '#FDA29B' : undefined}
                />
                <Figure value={totals.fixed} label="verified fixed" onInk tint={totals.fixed ? '#7FE0AC' : undefined} />
                <Figure
                  value={totals.reopened}
                  label="came back"
                  onInk
                  tint={totals.reopened ? '#FDA29B' : undefined}
                />
              </div>
            </div>
          </section>

          <section className="shell stack-md">
            <SectionHead kicker="The table" title="Ranked by broken promises" />
            <div style={{ height: 6 }} />
            {rows.map((r, i) => (
              <article
                key={r.id}
                className="card"
                style={{ padding: 'clamp(18px, 2.4vw, 26px)', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <span
                  className="figure"
                  style={{ fontSize: 34, width: 52, color: 'var(--ink-3)', flexShrink: 0 }}
                >
                  {i + 1}
                </span>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 className="title">{r.name}</h3>
                  <div style={{ marginTop: 7 }}>
                    <Eyebrow>{LEVEL_LABEL[r.level] ?? r.level}</Eyebrow>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap' }}>
                  <Figure value={r.open} label="open" />
                  <Figure
                    value={r.breached}
                    label="past deadline"
                    tint={r.breached ? SEV.critical.ink : undefined}
                  />
                  <Figure value={r.fixed} label="fixed" tint={r.fixed ? SEV.good.ink : undefined} />
                  <Figure
                    value={r.reopened}
                    label="came back"
                    tint={r.reopened ? SEV.critical.ink : undefined}
                  />
                  <Figure value={r.medianFixDays != null ? `${r.medianFixDays}d` : '—'} label="median fix" />
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="shell">
          <Empty
            kicker="No tickets owned yet"
            title="Nobody has been given a road to fix"
            body={`Authorities are registered, but no ticket has been routed to one — ${unassigned} open ticket${unassigned === 1 ? '' : 's'} currently sit outside every registered jurisdiction. Once an office owns work, its record appears here.`}
            action={<Pill variant="mark" href="/upload">Send in a road</Pill>}
          />
        </section>
      )}

      {unassigned && rows.length ? (
        <section className="shell">
          <p className="copy" style={{ color: 'var(--ink-3)' }}>
            {unassigned} open ticket{unassigned === 1 ? '' : 's'} sit outside every registered
            jurisdiction, so nobody owns them yet.
          </p>
        </section>
      ) : null}
    </div>
  );
}
