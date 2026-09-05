'use client';

import React from 'react';
import { Bar, Btn, Chip, Dot, Panel, PanelBody, PanelHead, SlaPlate } from '@/components/system';
import RoadMap from '@/components/data/RoadMap';
import { BarChart, LineChart } from '@/components/data/Charts';
import { CITY, WARDS } from '@/lib/fixtures/wards';
import { color, scoreTone, toneColor } from '@/lib/tokens';

const KPIS = [
  { label: 'City Road Health Score', value: '58', tone: color.amber, sub: 'down 6 points since July, post-monsoon' },
  { label: 'Open damage, city-wide', value: '1,204', tone: color.c.ink, sub: 'across 2,380 km of sensed road' },
  { label: 'Fixed and verified this month', value: '386', tone: color.green, sub: 'closure confirmed by passing vehicles' },
  { label: 'SLA breaches this month', value: '74', tone: color.red, sub: 'tickets past their promised date' },
  { label: 'Median time to fix', value: '13 days', tone: color.c.ink, sub: 'promised: 7 days on arterial roads' },
];

const SITTING = [
  { days: 9, road: 'G.S. Road, Ganeshguri', who: 'Executive Engineer, GMC Zone 3', id: 'GMC-W32-2461' },
  { days: 7, road: 'Rukminigaon main road', who: 'Ward Engineer, Ward 32', id: 'GMC-W32-2455' },
  { days: 4, road: 'Zoo Road Tiniali', who: 'Ward Engineer, Ward 31', id: 'GMC-W31-2402' },
];

const PROMISED = [
  { who: 'GMC ward engineers', actual: '17 d', promised: '7 d', tone: 'red' as const, bar: 92 },
  { who: 'GMC zone offices', actual: '11 d', promised: '7 d', tone: 'amber' as const, bar: 68 },
  { who: 'PWD Kamrup (Metro)', actual: '9 d', promised: '14 d', tone: 'green' as const, bar: 46 },
];

export default function BoardPage() {
  return (
    <div
      className="scrollarea"
      style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="h1">Guwahati road accountability board</h1>
          <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
            Open to anyone. Scores come from what vehicles measured, not from what was reported
            fixed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>September 2026</Btn>
          <Btn>Download data</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
        {KPIS.map((k) => (
          <Panel key={k.label} style={{ padding: '12px 14px' }}>
            <div className="sub" style={{ color: color.c.muted, fontSize: 11.5 }}>
              {k.label}
            </div>
            <div className="num" style={{ fontSize: 30, marginTop: 6, color: k.tone }}>
              {k.value}
            </div>
            <div className="tiny" style={{ color: color.c.dim, marginTop: 6 }}>
              {k.sub}
            </div>
          </Panel>
        ))}
      </div>

      <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'stretch', height: 541, flexShrink: 0 }}>
        <Panel flush className="rs-fixed" style={{ width: 716, flexShrink: 0 }}>
          <PanelHead
            title="Road condition, measured"
            right={
              <span style={{ display: 'flex', gap: 6 }}>
                <Chip tone="green" dot>Good</Chip>
                <Chip tone="amber" dot>Deteriorating</Chip>
                <Chip tone="red" dot>Failed</Chip>
              </span>
            }
          />
          <RoadMap width={714} height={448} theme="light" rci seed={1} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 16px',
              borderTop: `1px solid ${color.c.lineSoft}`,
              gap: 10,
            }}
          >
            <span className="tiny" style={{ color: color.c.muted }}>
              {CITY.sensedKm.toLocaleString('en-IN')} km measured by {CITY.vehicles.toLocaleString('en-IN')} vehicles in the last 30 days
            </span>
            <Chip>Updated 4 min ago</Chip>
          </div>
        </Panel>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel>
            <PanelHead
              title="Ward road health"
              right={
                <span className="tiny" style={{ color: color.c.dim }}>
                  Score out of 100
                </span>
              }
            />
            <PanelBody style={{ paddingTop: 6 }}>
              {WARDS.map((w, i) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 0',
                    borderBottom: i < WARDS.length - 1 ? '1px solid #F5F5F5' : undefined,
                  }}
                >
                  <span style={{ width: 138, fontSize: 12.5, fontWeight: 500, flexShrink: 0 }}>
                    {w.name}
                  </span>
                  <Bar value={w.score} tone={scoreTone(w.score)} width={150} />
                  <span
                    className="num"
                    style={{ fontSize: 19, width: 30, textAlign: 'right', color: toneColor(scoreTone(w.score), 'light') }}
                  >
                    {w.score}
                  </span>
                  <span className="tiny" style={{ color: color.c.muted, width: 54, textAlign: 'right' }}>
                    {w.open} open
                  </span>
                  <Chip tone={w.breached > 5 ? 'red' : 'neutral'}>{w.breached} breached</Chip>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel style={{ flex: 1 }}>
            <PanelHead title="Who is sitting on tickets" right={<Chip tone="red">74 breaches</Chip>} />
            <PanelBody style={{ paddingTop: 6 }}>
              {SITTING.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < SITTING.length - 1 ? '1px solid #F5F5F5' : undefined,
                  }}
                >
                  <SlaPlate value={s.days} unit="days late" tone="red" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, letterSpacing: '-0.011em' }}>
                      {s.road}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted }}>
                      Sitting with {s.who}
                    </span>
                  </span>
                  <span className="mono" style={{ color: color.c.muted }}>
                    {s.id}
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <Panel>
          <PanelHead title="City score, last 12 months" />
          <PanelBody>
            <LineChart
              width={410}
              height={94}
              theme="light"
              labels={['Sep 25', '', '', '', '', '', '', '', '', '', '', 'Sep 26']}
              series={[{ data: [71, 73, 72, 70, 68, 64, 59, 55, 52, 54, 57, 58], color: color.amber }]}
            />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHead title="New damage found per week" />
          <PanelBody>
            <BarChart
              data={[61, 74, 58, 92, 120, 141, 166, 138, 104]}
              labels={['Jul 7', '', '', '', '', '', '', '', 'Sep 1']}
              width={410}
              height={94}
              theme="light"
              accent={color.blue}
            />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHead title="Promised against actual" />
          <PanelBody style={{ paddingTop: 8 }}>
            {PROMISED.map((p) => (
              <div key={p.who} style={{ marginBottom: 9 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12.5 }}>{p.who}</span>
                  <span className="mono" style={{ color: toneColor(p.tone, 'light') }}>
                    {p.actual} vs {p.promised}
                  </span>
                </div>
                <Bar value={p.bar} tone={p.tone} />
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
