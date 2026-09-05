'use client';

import React, { useState } from 'react';
import { Btn, Chip, Dot, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import RoadMap, { roadSlice } from '@/components/data/RoadMap';
import RoughnessTrace from '@/components/data/RoughnessTrace';
import { IconCar } from '@/components/chrome/Icons';
import { color } from '@/lib/tokens';

const FASTEST: [number, number][] = [
  ...roadSlice('R.G. Baruah Road', 0.5, 1.0),
  [0.895, 0.545],
  [0.888, 0.665],
];
const SMOOTHEST: [number, number][] = [
  ...roadSlice('G.S. Road', 0.3, 0.74),
  ...roadSlice('NH-27 Bypass', 0.62, 0.875),
  [0.888, 0.665],
];

const STRETCHES = [
  {
    name: 'R.G. Baruah Road, Zoo gate to Six Mile',
    km: '3.1 km',
    tone: 'red' as const,
    note: 'Two severe potholes reported by 60 vehicles this week. Open with GMC for 9 days.',
  },
  {
    name: 'G.S. Road, Ganeshguri to Dispur',
    km: '2.4 km',
    tone: 'green' as const,
    note: 'Resurfaced in June. No damage detected in the last 400 passes.',
  },
  {
    name: 'NH-27 Bypass, Dispur to Khanapara',
    km: '5.8 km',
    tone: 'green' as const,
    note: 'Good surface. One patch near Sarusajai is being watched for cracking.',
  },
];

export default function RoutesPage() {
  const [pick, setPick] = useState<'smoothest' | 'fastest'>('smoothest');

  const OPTIONS = [
    {
      id: 'smoothest' as const,
      title: 'Smoothest',
      time: '26 min',
      km: '11.2 km',
      spots: '2 rough spots',
      tone: 'green' as const,
      rough: false,
      note: 'Avoids the broken stretch on G.S. Road between Ganeshguri and Bhangagarh. 4 minutes slower, worth it on a scooter.',
    },
    {
      id: 'fastest' as const,
      title: 'Fastest',
      time: '22 min',
      km: '9.4 km',
      spots: '9 rough spots',
      tone: 'red' as const,
      rough: true,
      note: 'Crosses two severe potholes and 640 m of alligator cracking near Ganeshguri flyover.',
    },
  ];

  return (
    <div
      className="scrollarea rs-row"
      style={{ padding: '20px 28px', display: 'flex', gap: 18, flex: 1, alignItems: 'flex-start' }}
    >
      <div className="rs-fixed" style={{ width: 880, flexShrink: 0 }}>
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
            <h1 className="h1">Ganeshguri to Khanapara</h1>
            <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
              Two ways to get there. One is quicker, one will not shake your spine loose.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn>Two-wheeler</Btn>
            <Btn primary>Smoothest</Btn>
          </div>
        </div>

        <Panel flush>
          <RoadMap
            width={880}
            height={704}
            theme="light"
            seed={3}
            routes={[
              {
                points: FASTEST,
                color: color.red,
                width: pick === 'fastest' ? 5 : 3.5,
                dash: pick === 'fastest' ? undefined : '9 8',
              },
              {
                points: SMOOTHEST,
                color: color.green,
                width: pick === 'smoothest' ? 5 : 3.5,
                dash: pick === 'smoothest' ? undefined : '9 8',
              },
            ]}
            points={[
              { x: 0.6, y: 0.462, sev: 'critical', ring: true },
              { x: 0.685, y: 0.448, sev: 'high' },
              { x: 0.775, y: 0.462, sev: 'critical', ring: true },
              { x: 0.53, y: 0.475, sev: 'medium' },
              { x: 0.66, y: 0.79, sev: 'low' },
            ]}
            pins={[
              { x: 0.478, y: 0.487, label: 'Ganeshguri', tone: 'black' },
              { x: 0.888, y: 0.665, label: 'Khanapara', tone: 'amber' },
            ]}
          />
        </Panel>

        <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
          {STRETCHES.map((s) => (
            <Panel key={s.name} style={{ flex: 1, minWidth: 0, padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Dot tone={s.tone} size={7} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.011em' }}>
                  {s.name}
                </span>
              </div>
              <div className="mono" style={{ color: color.c.muted, marginTop: 7 }}>
                {s.km}
              </div>
              <p className="tiny" style={{ color: color.c.muted, marginTop: 7, lineHeight: 1.5 }}>
                {s.note}
              </p>
            </Panel>
          ))}
        </div>
      </div>

      <div className="rs-fixed" style={{ width: 474, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Panel style={{ padding: '13px 16px' }}>
          {[
            ['Ganeshguri flyover, Dispur', 'dot'],
            ['Khanapara, NH-27 junction', 'square'],
          ].map(([label, shape], i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 0',
                borderTop: i > 0 ? `1px solid ${color.c.lineSoft}` : undefined,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 9,
                  height: 9,
                  background: shape === 'dot' ? '#0A0A0A' : color.mark,
                  borderRadius: shape === 'dot' ? '50%' : 2,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.011em' }}>
                {label}
              </span>
            </div>
          ))}
        </Panel>

        {OPTIONS.map((o) => {
          const on = pick === o.id;
          return (
            <Panel
              key={o.id}

              onClick={() => setPick(o.id)}
              style={{
                cursor: 'pointer',
                border: on ? '1.5px solid #0A0A0A' : `1px solid ${color.c.line}`,
              }}
            >
              <PanelHead
                title={o.title}
                right={on ? <Chip tone="green">Selected</Chip> : null}
              />
              <PanelBody>
                <div style={{ display: 'flex', gap: 22 }}>
                  <span>
                    <span className="num" style={{ display: 'block', fontSize: 22 }}>
                      {o.time}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted }}>
                      travel time
                    </span>
                  </span>
                  <span>
                    <span className="num" style={{ display: 'block', fontSize: 22 }}>
                      {o.km}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted }}>
                      distance
                    </span>
                  </span>
                  <span>
                    <span
                      className="num"
                      style={{
                        display: 'block',
                        fontSize: 22,
                        color: o.tone === 'green' ? color.green : color.red,
                      }}
                    >
                      {o.spots}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted }}>
                      ride quality
                    </span>
                  </span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <RoughnessTrace width={390} height={54} rough={o.rough} theme="light" seed={o.rough ? 8 : 2} />
                </div>
                <p className="tiny" style={{ color: color.c.muted, marginTop: 10, lineHeight: 1.5 }}>
                  {o.note}
                </p>
              </PanelBody>
            </Panel>
          );
        })}

        <Panel>
          <PanelHead title="Make this your daily commute" />
          <PanelBody>
            <p className="sub" style={{ color: color.c.muted }}>
              We will warn you about new damage on this stretch before you leave, and tell you when a
              repair is verified.
            </p>
            <Btn primary style={{ marginTop: 12 }}>
              Save commute
            </Btn>
          </PanelBody>
        </Panel>

        <Inset style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ color: color.c.muted, marginTop: 1 }}>
            <IconCar size={20} />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, letterSpacing: '-0.011em' }}>
              Why smoother matters for you
            </span>
            <span className="tiny" style={{ color: color.c.muted, display: 'block', marginTop: 5, lineHeight: 1.5 }}>
              You ride a two-wheeler. Smoothest routing cut your rough-road exposure by 71% last
              month.
            </span>
          </span>
        </Inset>
      </div>
    </div>
  );
}
