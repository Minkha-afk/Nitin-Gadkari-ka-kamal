'use client';

import React from 'react';
import Link from 'next/link';
import { Bar, Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import RoutePlanner from '@/components/data/RoutePlanner';
import { IconUp } from '@/components/chrome/Icons';
import type { Overview, RecentDefect } from '@/lib/overview';
import { color, severityColor, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

function ago(iso: string | null) {
  if (!iso) return null;
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} minutes ago`;
  if (s < 172_800) return `${Math.round(s / 3600)} hours ago`;
  return `${Math.round(s / 86_400)} days ago`;
}

export default function CitizenHome({ overview }: { overview: Overview }) {
  const { totals, bySeverity, byClass, recent, mapPoints } = overview;
  const empty = totals.defects === 0;
  const worst = bySeverity[0]?.severity ?? null;

  return (
    <div
      className="scrollarea"
      style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}
    >
      <RoutePlanner />

      {!overview.configured || overview.error ? (
        <Panel style={{ padding: '12px 15px', borderColor: '#FAE7C6', background: '#FFFCF5', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.014em', color: '#B45E09' }}>
            {overview.configured ? 'The road database could not be read' : 'No road database connected'}
          </div>
          <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.5 }}>
            {overview.error ??
              'Set MONGODB_URI in .env.local. Until then nothing that has been sent in can be shown here.'}
          </div>
        </Panel>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexShrink: 0 }}>
        <div>
          <h1 className="h1">Roads around you, right now</h1>
          <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
            {empty
              ? 'Nothing has been sent in yet. The first upload puts a road on the map above.'
              : `${totals.defects} defect${totals.defects === 1 ? '' : 's'} from ${totals.uploads} upload${
                  totals.uploads === 1 ? '' : 's'
                }${overview.lastReportAt ? ` · last report ${ago(overview.lastReportAt)}` : ''}`}
          </p>
        </div>
        <Link href="/upload">
          <Btn primary>
            <IconUp size={14} />
            Send in a road
          </Btn>
        </Link>
      </div>

      <div className="rs-row" style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexShrink: 0 }}>
        {/* left — every report, newest first */}
        <Panel flush className="rs-fixed" style={{ width: 860, flexShrink: 0 }}>
          <PanelHead
            title="Latest reports"
            sub={empty ? undefined : `${recent.length} most recent of ${totals.defects}`}
          />
          {recent.length ? (
            <div style={{ padding: '10px 14px 12px' }}>
              {recent.map((d, i) => (
                <ReportRow key={d.id} d={d} last={i === recent.length - 1} />
              ))}
            </div>
          ) : (
            <PanelBody>
              <Inset style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="sub" style={{ color: color.c.muted, flex: 1 }}>
                  {mapPoints.length === 0 && totals.defects > 0
                    ? 'Defects have been reported but none carry coordinates. The detector reads GPS off an ' +
                      'overlay burned into the frame; footage without one still gets analysed, it just cannot ' +
                      'be placed on a map.'
                    : 'No reports yet. Anything you upload shows here with the frame it was found in, where it ' +
                      'was, and how sure the detector was.'}
                </span>
                <Link href="/upload">
                  <Btn>Upload</Btn>
                </Link>
              </Inset>
            </PanelBody>
          )}
        </Panel>

        {/* right — what the database actually holds */}
        <div
          className="rs-fixed"
          style={{ width: 494, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <Panel>
            <PanelHead
              title="What has been reported"
              right={
                worst && !empty ? (
                  <Chip tone={severityTone[worst]} dot>
                    worst is {worst}
                  </Chip>
                ) : null
              }
            />
            <PanelBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  [totals.defects, 'distinct defects'],
                  [totals.located, 'with coordinates'],
                  [totals.sightings, 'frame sightings'],
                  [totals.roads, 'named streets'],
                ].map(([v, l]) => (
                  <div key={l as string}>
                    <div className="num" style={{ fontSize: 22 }}>
                      {v as number}
                    </div>
                    <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.4 }}>
                      {l as string}
                    </div>
                  </div>
                ))}
              </div>

              {bySeverity.length ? (
                <div style={{ marginTop: 14 }}>
                  {bySeverity.map((s) => (
                    <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <span style={{ width: 64, fontSize: 12.5, textTransform: 'capitalize' }}>{s.severity}</span>
                      <Bar
                        value={(s.count / totals.defects) * 100}
                        color={severityColor(s.severity, 'light')}
                        style={{ flex: 1 }}
                      />
                      <span className="num" style={{ fontSize: 14, width: 30, textAlign: 'right' }}>
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tiny" style={{ color: color.c.muted, marginTop: 14, lineHeight: 1.55 }}>
                  Severity appears here once a road has been analysed. It comes from the detector, which
                  reports visible surface damage only — never an official safety determination.
                </p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="By damage type" />
            <PanelBody>
              {byClass.length ? (
                byClass.map((c) => (
                  <div
                    key={c.damageClass}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}
                  >
                    <span style={{ flex: 1, fontSize: 12.5 }}>
                      {CLASS_LABEL[c.damageClass] ?? c.damageClass}
                    </span>
                    <Bar value={(c.count / totals.defects) * 100} width={150} color={color.c.ink} />
                    <span className="num" style={{ fontSize: 14, width: 30, textAlign: 'right' }}>
                      {c.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.55 }}>
                  Nothing classified yet. The detector separates potholes from alligator, longitudinal and
                  transverse cracking; patched road is deliberately not counted as damage.
                </p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>

    </div>
  );
}

function ReportRow({ d, last }: { d: RecentDefect; last: boolean }) {
  const tone = severityTone[d.severity];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '11px 0',
        borderBottom: last ? undefined : '1px solid #F5F5F5',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={d.imageUrl}
        alt=""
        style={{
          width: 76,
          height: 50,
          objectFit: 'cover',
          borderRadius: 7,
          border: `1px solid ${color.c.line}`,
          background: color.c.inset,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.011em' }}>
          {CLASS_LABEL[d.damageClass] ?? d.damageClass}
        </span>
        <span
          className="tiny"
          style={{
            color: color.c.muted,
            display: 'block',
            marginTop: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.address ??
            (d.lat != null && d.lng != null
              ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`
              : 'no coordinates on this footage')}
        </span>
        <span className="mono" style={{ color: color.c.dim, display: 'block', marginTop: 3 }}>
          {ago(d.createdAt)} · {(d.confidence * 100).toFixed(0)}% confidence
          {d.sightings > 1 ? ` · seen in ${d.sightings} frames` : ''}
          {d.fileName ? ` · ${d.fileName}` : ''}
        </span>
      </span>
      {d.mapsUrl ? (
        <a
          href={d.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="tiny"
          style={{ color: color.blue, textDecoration: 'none', flexShrink: 0 }}
        >
          Maps
        </a>
      ) : null}
      <Chip tone={tone} style={{ flexShrink: 0 }}>
        {d.severityLabel}
      </Chip>
      <span style={{ width: 4, height: 30, borderRadius: 2, background: toneColor(tone, 'light'), flexShrink: 0 }} />
    </div>
  );
}
