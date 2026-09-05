'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bar,
  Btn,
  Chip,
  Dot,
  Inset,
  Panel,
  PanelBody,
  PanelHead,
} from '@/components/system';
import RoadMap, { roadSlice } from '@/components/data/RoadMap';
import RoutePlanner from '@/components/data/RoutePlanner';
import { Gauge } from '@/components/data/Charts';
import { LaneGlyph } from '@/components/chrome/Brand';
import { IconShield } from '@/components/chrome/Icons';
import { FOLLOWED } from '@/lib/fixtures/tickets';
import { color, toneColor } from '@/lib/tokens';

const HOME_POINTS = [
  { x: 0.47, y: 0.47, sev: 'critical' as const, ring: true },
  { x: 0.53, y: 0.63, sev: 'high' as const },
  { x: 0.62, y: 0.4, sev: 'medium' as const },
  { x: 0.36, y: 0.72, sev: 'high' as const },
  { x: 0.72, y: 0.6, sev: 'critical' as const, ring: true },
  { x: 0.3, y: 0.3, sev: 'low' as const },
  { x: 0.8, y: 0.71, sev: 'medium' as const },
  { x: 0.55, y: 0.85, sev: 'good' as const },
  { x: 0.45, y: 0.34, sev: 'high' as const },
];

const COMMUTE: [number, number][] = [
  ...roadSlice('G.S. Road', 0.02, 0.52),
  ...roadSlice('R.G. Baruah Road', 0.62, 0.95),
  [0.762, 0.612],
];

const AHEAD = [
  {
    d: 320,
    road: 'G.S. Road, before Ganeshguri flyover',
    detail: 'Pothole cluster · 4 detections today',
    chip: 'Severe',
    tone: 'red' as const,
  },
  {
    d: 910,
    road: 'R.G. Baruah Road, near Zoo gate',
    detail: 'Alligator cracking · widening',
    chip: 'Moderate',
    tone: 'amber' as const,
  },
  {
    d: 1400,
    road: 'Zoo Road Tiniali',
    detail: 'Edge break beside drain',
    chip: 'Minor',
    tone: 'neutral' as const,
  },
];

const LEGEND = [
  ['Severe', 'red'],
  ['Moderate', 'amber'],
  ['Minor', 'blue'],
  ['Fixed', 'green'],
] as const;

export default function CitizenHome() {
  return (
    <div
      className="scrollarea"
      style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}
    >
      <RoutePlanner />

      <div className="rs-row" style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* left */}
        <div className="rs-fixed" style={{ width: 860, flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 14,
            }}
          >
            <div>
              <h1 className="h1">Roads around you, right now</h1>
              <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
                Guwahati · updated 4 minutes ago from 1,842 vehicles sensing today
              </p>
            </div>
            <Link href="/drive">
              <Btn primary>Start drive</Btn>
            </Link>
          </div>

          <Panel flush style={{ position: 'relative' }}>
            <RoadMap
              width={840}
              height={470}
              theme="light"
              points={HOME_POINTS}
              pins={[
                { x: 0.437, y: 0.325, label: 'Home', tone: 'black' },
                { x: 0.762, y: 0.612, label: 'Office', tone: 'amber' },
              ]}
              routes={[{ points: COMMUTE, color: '#0A0A0A', dash: '7 7', width: 3 }]}
              seed={2}
            />
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: '#FFF',
                border: `1px solid ${color.c.border}`,
                borderRadius: 12,
                padding: '11px 13px',
              }}
            >
              <div className="lbl" style={{ color: color.c.muted }}>
                Damage reported in last 7 days
              </div>
              <div
                aria-hidden
                style={{
                  height: 3,
                  margin: '9px 0',
                  background: `repeating-linear-gradient(90deg, ${color.mark} 0 9px, transparent 9px 18px)`,
                  borderRadius: 2,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LEGEND.map(([label, tone]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Dot tone={tone} size={7} />
                    <span style={{ fontSize: 12, color: color.c.ink }}>{label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                right: 14,
                bottom: 14,
                background: '#FFF',
                border: `1px solid ${color.c.border}`,
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <LaneGlyph size={34} radius={9} />
              <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.011em' }}>
                Your usual drive home
              </span>
            </div>
          </Panel>
        </div>

        {/* right */}
        <div className="rs-fixed" style={{ width: 494, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel>
            <PanelHead
              title="On your route home"
              right={
                <span className="tiny" style={{ color: color.c.dim }}>
                  Dispur → Six Mile
                </span>
              }
            />
            <PanelBody style={{ paddingTop: 4 }}>
              {AHEAD.map((a, i) => (
                <div
                  key={a.road}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 0',
                    borderBottom: i < AHEAD.length - 1 ? `1px solid #F5F5F5` : undefined,
                  }}
                >
                  <span style={{ width: 66, flexShrink: 0 }}>
                    <span className="num" style={{ fontSize: 19, color: toneColor(a.tone, 'light') }}>
                      {a.d}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        marginLeft: 2,
                        color: toneColor(a.tone, 'light'),
                      }}
                    >
                      m
                    </span>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13.5,
                        fontWeight: 600,
                        letterSpacing: '-0.011em',
                      }}
                    >
                      {a.road}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted }}>
                      {a.detail}
                    </span>
                  </span>
                  <Chip tone={a.tone}>{a.chip}</Chip>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="What you contributed" />
            <PanelBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  ['412 km', 'Road sensed this month'],
                  ['96', 'Damage detections sent'],
                  ['38', 'Confirmed by other drivers'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div className="num" style={{ fontSize: 22 }}>
                      {v}
                    </div>
                    <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.4 }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              <Inset style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  aria-hidden
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: color.mark,
                    color: '#0A0A0A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconShield size={20} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.011em' }}>
                    Road Guardian · 2,480 points
                  </span>
                  <span className="tiny" style={{ color: color.c.muted }}>
                    14th in Dispur ward. 220 points to the next tier.
                  </span>
                  <Bar value={64} width={120} color={color.mark} style={{ marginTop: 8 }} />
                </span>
              </Inset>
            </PanelBody>
          </Panel>
        </div>
      </div>

      {/* row 2 */}
      <div className="rs-row" style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
        <Panel className="rs-fixed" style={{ width: 494, flexShrink: 0 }}>
          <PanelHead title="Ward 32 · Dispur, this month" />
          <PanelBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Gauge value={41} size={86} theme="light" color={color.red} caption="of 100" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.014em' }}>
                  Ward 32 · Dispur
                </div>
                <p className="sub" style={{ color: color.c.muted, marginTop: 5 }}>
                  Road health fell 11 points after the July–August rain. 62 open damages, 9 of them
                  past their repair deadline.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 14 }}>
              {[
                ['9', 'breached deadlines', color.red],
                ['23', 'fixed and verified', color.green],
                ['17 d', 'median fix time', color.c.ink],
              ].map(([v, l, c]) => (
                <Inset key={l}>
                  <div className="num" style={{ fontSize: 22, color: c }}>
                    {v}
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
                    {l}
                  </div>
                </Inset>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel flush style={{ flex: 1, minWidth: 0 }}>
          <PanelHead
            title="Reports you are following"
            right={
              <Link href="/reports" style={{ fontSize: 12.5, color: color.c.muted }}>
                See all 6
              </Link>
            }
          />
          <div style={{ padding: '10px 12px 8px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ color: color.c.muted, padding: '0 8px 9px', borderBottom: `1px solid ${color.c.line}` }}>Ticket</th>
                  <th scope="col" style={{ color: color.c.muted, padding: '0 8px 9px', borderBottom: `1px solid ${color.c.line}` }}>Where</th>
                  <th scope="col" style={{ color: color.c.muted, padding: '0 8px 9px', borderBottom: `1px solid ${color.c.line}` }}>Status</th>
                  <th scope="col" style={{ color: color.c.muted, padding: '0 8px 9px', borderBottom: `1px solid ${color.c.line}`, textAlign: 'right' }}>SLA</th>
                </tr>
              </thead>
              <tbody>
                {FOLLOWED.map((f, i) => (
                  <tr key={f.id}>
                    <td style={{ padding: '9px 8px', borderBottom: i < FOLLOWED.length - 1 ? '1px solid #F5F5F5' : undefined }}>
                      <span className="mono">{f.id}</span>
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: i < FOLLOWED.length - 1 ? '1px solid #F5F5F5' : undefined, color: color.c.ink }}>
                      {f.where}
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: i < FOLLOWED.length - 1 ? '1px solid #F5F5F5' : undefined }}>
                      <Chip tone={f.tone}>{f.status}</Chip>
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: i < FOLLOWED.length - 1 ? '1px solid #F5F5F5' : undefined, textAlign: 'right', color: color.c.muted }}>
                      {f.sla}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
