'use client';

/**
 * Your reports.
 *
 * The old version led with five counters and a table. This leads with the one
 * number that means anything — what actually got fixed because of you — and
 * shows each ticket as its photograph plus a progress track, because "assigned"
 * means nothing next to a picture of the hole and how long it has been open.
 */

import React from 'react';
import { Divider, Empty, Eyebrow, Figure, Pill, SectionHead, SevBadgeOnShot, SEV, ago } from './ui';
import type { MyDefect, MyReports, MyTicket } from '@/lib/reports';
import { CLASS_LABEL, type TicketState } from '@/lib/types';

/** The journey a ticket takes, so a row can show where it has got to. */
const TRACK: { state: TicketState; label: string }[] = [
  { state: 'new', label: 'Reported' },
  { state: 'acknowledged', label: 'Seen' },
  { state: 'assigned', label: 'Assigned' },
  { state: 'repaired', label: 'Repaired' },
  { state: 'verified', label: 'Verified' },
];

const STATE_COPY: Record<TicketState, string> = {
  new: 'Waiting to be seen',
  acknowledged: 'Acknowledged',
  assigned: 'Contractor assigned',
  repaired: 'Repaired, not yet verified',
  verified: 'Verified fixed',
  closed: 'Closed',
  reopened: 'The damage came back',
};

export default function ReportsClient({ data }: { data: MyReports }) {
  const { totals, tickets, defects, following } = data;
  const nothing = totals.defects === 0 && totals.uploads === 0;

  if (nothing) {
    return (
      <div className="shell stack-lg" style={{ paddingTop: 56 }}>
        <div>
          <Eyebrow>Your reports</Eyebrow>
          <h1 className="display" style={{ marginTop: 16, maxWidth: '14ch' }}>
            Nothing sent in yet.
          </h1>
        </div>
        <Empty
          kicker="Start here"
          title="Your first road takes a minute"
          body="Upload a photo or a clip and every defect found in it is kept here — with the frame it was found in, where it was, and what happened after you reported it."
          action={<Pill variant="mark" href="/upload">Send in a road</Pill>}
        />
      </div>
    );
  }

  return (
    <div className="stack-xl" style={{ paddingTop: 48 }}>
      {/* ── headline ─────────────────────────────────────────────────── */}
      <section className="shell">
        <Eyebrow>Your reports</Eyebrow>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '16ch' }}>
          {totals.fixed > 0
            ? `${totals.fixed} road${totals.fixed === 1 ? '' : 's'} fixed because you filmed ${totals.fixed === 1 ? 'it' : 'them'}.`
            : `${totals.defects} defect${totals.defects === 1 ? '' : 's'} on record because of you.`}
        </h1>
        <p className="lede" style={{ marginTop: 18 }}>
          {totals.tickets > 0
            ? `${totals.tickets} of them became tickets an authority is held to. ${totals.open} still open.`
            : 'None were severe enough to open a ticket automatically — only high and critical damage escalates on its own.'}
        </p>

        <div style={{ height: 40 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 28 }}>
          <Figure value={totals.defects} label="defects sent" />
          <Figure value={totals.tickets} label="became tickets" />
          <Figure value={totals.fixed} label="fixed" tint={totals.fixed ? SEV.good.ink : undefined} />
          <Figure value={totals.breached} label="past deadline" tint={totals.breached ? SEV.critical.ink : undefined} />
          <Figure value={data.medianFixDays != null ? `${data.medianFixDays}d` : '—'} label="median fix" />
        </div>
      </section>

      {/* ── tickets ──────────────────────────────────────────────────── */}
      <section className="shell stack-lg">
        <SectionHead
          kicker="Tickets"
          title="What happened next"
          sub={tickets.length ? undefined : 'Severe damage opens a ticket automatically. Nothing you sent reached that bar.'}
        />
        {tickets.length ? (
          <div className="stack-md">
            {tickets.map((t) => (
              <TicketCard key={t.id} t={t} />
            ))}
          </div>
        ) : null}
      </section>

      {following.length ? (
        <section className="shell stack-lg">
          <SectionHead kicker="Following" title="Raised by someone else" />
          <div className="stack-md">
            {following.map((t) => (
              <TicketCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── the vault ────────────────────────────────────────────────── */}
      <section className="stack-lg">
        <div className="shell">
          <SectionHead
            kicker="Evidence"
            title="Everything you have filmed"
            sub="Timestamped and geotagged. Useful the day a claim needs it."
          />
        </div>
        <div className="rail shell">
          {defects.map((d) => (
            <VaultCard key={d.id} d={d} />
          ))}
        </div>
      </section>

      {/* ── honest footer ────────────────────────────────────────────── */}
      <section className="shell">
        <div className="card" style={{ padding: 26 }}>
          <Eyebrow>Whose reports are these</Eyebrow>
          <p className="copy" style={{ marginTop: 12, maxWidth: '64ch' }}>
            This page is scoped to <strong style={{ color: 'var(--ink)' }}>this browser</strong>, not an
            account — there are no logins yet. Uploads from another browser, or after clearing cookies,
            start a separate history, and there is no way to merge them.
          </p>
        </div>
      </section>
    </div>
  );
}

function TicketCard({ t }: { t: MyTicket }) {
  const reached = TRACK.findIndex((s) => s.state === t.state);
  const settled = t.state === 'closed' || t.state === 'verified';
  const stepIndex = t.state === 'closed' ? TRACK.length - 1 : t.state === 'reopened' ? 0 : reached;
  const dueTint =
    t.urgency === 'breached' ? SEV.critical.ink : t.urgency === 'soon' ? SEV.medium.ink : 'var(--ink-3)';

  return (
    <article className="card" style={{ padding: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div className="shot" style={{ width: 168, aspectRatio: '4 / 3', borderRadius: 14, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.imageUrl} alt="" />
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <SevBadgeOnShot severity={t.severity}>{t.severityLabel}</SevBadgeOnShot>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h3 className="title">{t.address ?? CLASS_LABEL[t.damageClass]}</h3>
          <Eyebrow>{t.id}</Eyebrow>
        </div>
        <p className="copy" style={{ marginTop: 7, fontSize: 13.5 }}>
          {CLASS_LABEL[t.damageClass] ?? t.damageClass} · reported {ago(t.createdAt)}
          {t.passes > 1 ? ` · seen on ${t.passes} passes` : ''}
        </p>

        {/* progress track */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {TRACK.map((s, i) => {
            const done = stepIndex >= i && !(t.state === 'reopened' && i > 0);
            return (
              <div key={s.state} style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: done
                      ? t.state === 'reopened'
                        ? SEV.critical.ink
                        : settled
                          ? SEV.good.ink
                          : 'var(--ink)'
                      : '#E8E5E0',
                    transition: 'background 0.3s var(--ease)',
                  }}
                />
                <div
                  className="eyebrow"
                  style={{
                    display: 'block',
                    marginTop: 8,
                    fontSize: 9.5,
                    letterSpacing: '0.1em',
                    color: done ? 'var(--ink-2)' : 'var(--ink-3)',
                  }}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 650,
              color: t.state === 'reopened' ? SEV.critical.ink : settled ? SEV.good.ink : 'var(--ink)',
            }}
          >
            {STATE_COPY[t.state]}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--ink-3)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: dueTint }}>{t.dueLabel}</span>
        </div>
      </div>
    </article>
  );
}

function VaultCard({ d }: { d: MyDefect }) {
  return (
    <article className="card card-interactive" style={{ width: 236, padding: 10 }}>
      <div className="shot" style={{ aspectRatio: '1 / 1', borderRadius: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.imageUrl} alt="" />
      </div>
      <div style={{ padding: '12px 5px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: '-0.014em' }}>
          {CLASS_LABEL[d.damageClass] ?? d.damageClass}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--ink-2)',
            marginTop: 5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.address ?? (d.lat != null && d.lng != null ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : 'no coordinates')}
        </div>
        <div style={{ marginTop: 9 }}>
          <Eyebrow>{ago(d.createdAt)}</Eyebrow>
        </div>
      </div>
    </article>
  );
}
