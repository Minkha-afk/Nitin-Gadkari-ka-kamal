'use client';

/**
 * Citizen home.
 *
 * Structure follows what someone actually wants, in order: the answer to
 * "is my drive bad", then what the city looks like, then what has just come in,
 * then what all of it adds up to. Statistics come last, not first — a wall of
 * counters at the top is the thing that made this feel like a report.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import RoutePlanner from '@/components/data/RoutePlanner';
import { Divider, Empty, Eyebrow, Figure, Pill, SectionHead, SevBadgeOnShot, SEV, ago } from './ui';
import type { Overview, RecentDefect } from '@/lib/overview';
import { CLASS_LABEL } from '@/lib/types';

const TripMap = dynamic(() => import('@/components/data/TripMap'), {
  ssr: false,
  loading: () => <div style={{ height: 520, background: '#EFEDE9' }} />,
});

export default function CitizenHome({ overview }: { overview: Overview }) {
  const { totals, bySeverity, byClass, recent, mapPoints } = overview;
  const empty = totals.defects === 0;

  return (
    <div className="stack-xl" style={{ paddingTop: 40 }}>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="shell">
        <div className="ink-panel rise" style={{ padding: 'clamp(28px, 4vw, 56px)' }}>
          <Eyebrow style={{ color: 'rgba(247,245,242,0.45)' }}>Road intelligence · live</Eyebrow>
          <h1 className="display" style={{ marginTop: 18, color: '#F7F5F2', maxWidth: '15ch' }}>
            Know the road
            <br />
            before you&rsquo;re on it.
          </h1>
          <p className="lede" style={{ marginTop: 20, color: 'rgba(247,245,242,0.6)', maxWidth: '46ch' }}>
            Every pothole and crack a camera has sent in, matched against the drive you are about to
            take.
          </p>

          <div style={{ height: 36 }} />
          <RoutePlanner />
        </div>
      </section>

      {/* ── the city ─────────────────────────────────────────────────── */}
      <section className="stack-lg">
        <div className="shell">
          <SectionHead
            kicker="The map"
            title="Everything reported so far"
            sub={
              empty
                ? 'Nothing has been sent in yet. The first upload puts a road on this map.'
                : `${totals.defects} defect${totals.defects === 1 ? '' : 's'} across ${totals.roads || totals.uploads} location${
                    (totals.roads || totals.uploads) === 1 ? '' : 's'
                  }${overview.lastReportAt ? ` · newest ${ago(overview.lastReportAt)}` : ''}`
            }
            action={<Pill variant="ghost" href="/routes">Compare routes</Pill>}
          />
        </div>

        {/* Full-bleed. A map boxed inside a card is a thumbnail; a map that
            runs to both edges is a place. */}
        {mapPoints.length ? (
          <div style={{ position: 'relative' }}>
            <TripMap route={[]} hazards={mapPoints} height={520} />
            <div
              className="hide-sm"
              style={{
                position: 'absolute',
                left: 'max(28px, calc(50vw - 620px + 28px))',
                bottom: 26,
                zIndex: 500,
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(10px)',
                borderRadius: 18,
                padding: '16px 18px',
                boxShadow: 'var(--lift-2)',
                minWidth: 190,
              }}
            >
              <Eyebrow>Severity</Eyebrow>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {bySeverity.map((s) => (
                  <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 999, background: SEV[s.severity].ink }} />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{SEV[s.severity].label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 650 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="shell">
            <Empty
              kicker="Nothing on the map"
              title="Be the first camera on these roads"
              body="Upload a photo or a dashcam clip. Every defect found in it lands here, ready to warn whoever drives it next."
              action={<Pill variant="solid" href="/upload">Send in a road</Pill>}
            />
          </div>
        )}
      </section>

      {/* ── the feed ─────────────────────────────────────────────────── */}
      {recent.length ? (
        <section className="stack-lg">
          <div className="shell">
            <SectionHead
              kicker="Just in"
              title="What cameras found"
              action={<Pill variant="ghost" href="/reports">Your reports</Pill>}
            />
          </div>
          <div className="rail shell" style={{ overflowX: 'auto' }}>
            {recent.map((d) => (
              <ReportCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── the total ────────────────────────────────────────────────── */}
      {!empty ? (
        <section className="shell">
          <div className="card" style={{ padding: 'clamp(26px, 3.4vw, 44px)' }}>
            <SectionHead kicker="In total" title="What has been sensed" />
            <div style={{ height: 30 }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 30,
              }}
            >
              <Figure value={totals.defects} label="distinct defects" />
              <Figure value={totals.sightings} label="camera sightings" />
              <Figure value={totals.located} label="pinned on the map" />
              <Figure value={totals.roads} label="named streets" />
              <Figure value={totals.uploads} label="uploads" />
            </div>

            {byClass.length ? (
              <>
                <div style={{ height: 34 }} />
                <Divider />
                <div style={{ height: 22 }} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {byClass.map((c) => (
                    <span
                      key={c.damageClass}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 9,
                        height: 38,
                        padding: '0 16px',
                        borderRadius: 999,
                        border: '1px solid var(--hairline)',
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {CLASS_LABEL[c.damageClass] ?? c.damageClass}
                      <span style={{ fontWeight: 700 }}>{c.count}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── close ────────────────────────────────────────────────────── */}
      <section className="shell">
        <div
          className="ink-panel"
          style={{
            padding: 'clamp(30px, 4vw, 58px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 28,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 className="display-sm" style={{ color: '#F7F5F2', maxWidth: '17ch' }}>
              A road nobody films is a road nobody fixes.
            </h2>
            <p className="copy" style={{ marginTop: 14, color: 'rgba(247,245,242,0.55)', maxWidth: '48ch' }}>
              Severe damage you send in opens a ticket with a deadline the authority is held to.
            </p>
          </div>
          <Pill variant="mark" href="/upload" style={{ height: 54, padding: '0 30px' }}>
            Send in a road
          </Pill>
        </div>
      </section>
    </div>
  );
}

/** One report, photograph first. */
function ReportCard({ d }: { d: RecentDefect }) {
  return (
    <article className="card card-interactive" style={{ width: 288, padding: 12, overflow: 'hidden' }}>
      <div className="shot shot-wash" style={{ aspectRatio: '4 / 3', borderRadius: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.imageUrl} alt="" />
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <SevBadgeOnShot severity={d.severity}>{d.severityLabel}</SevBadgeOnShot>
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, zIndex: 2 }}>
          <div style={{ color: '#fff', fontSize: 15.5, fontWeight: 650, letterSpacing: '-0.018em' }}>
            {CLASS_LABEL[d.damageClass] ?? d.damageClass}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 6px 6px' }}>
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--ink-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.address ??
            (d.lat != null && d.lng != null ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : 'no coordinates')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          <Eyebrow>{ago(d.createdAt)}</Eyebrow>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--ink-3)' }} />
          <Eyebrow>{(d.confidence * 100).toFixed(0)}% sure</Eyebrow>
        </div>
      </div>
    </article>
  );
}
