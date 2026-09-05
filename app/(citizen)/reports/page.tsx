'use client';

import React from 'react';
import { Bar, Btn, Chip, Dot, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import RoadMap from '@/components/data/RoadMap';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import { BarChart, Gauge } from '@/components/data/Charts';
import { IconShield } from '@/components/chrome/Icons';
import { MY_REPORTS } from '@/lib/fixtures/tickets';
import { color, toneColor } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.c.muted,
  padding: '0 10px 9px',
  borderBottom: `1px solid ${color.c.line}`,
};
const TD: React.CSSProperties = {
  padding: '10px',
  borderBottom: '1px solid #F5F5F5',
  color: color.c.ink,
  verticalAlign: 'middle',
};

const VAULT = [
  { text: 'G.S. Road, Ganeshguri · pothole 0.9 m × 0.4 m', kind: 'pothole' as const },
  { text: 'Beltola Road · rim strike, 38 km/h', kind: 'crack' as const },
  { text: 'NH-27 km 12.4 · pothole cluster', kind: 'pothole' as const },
];

const BY_TYPE = [
  { label: 'Pothole', n: 41, tone: 'red' as const },
  { label: 'Alligator crack', n: 28, tone: 'amber' as const },
  { label: 'Longitudinal crack', n: 19, tone: 'yellow' as const },
  { label: 'Transverse crack', n: 8, tone: 'blue' as const },
];

export default function ReportsPage() {
  return (
    <div
      className="scrollarea rs-row"
      style={{ padding: '20px 28px', display: 'flex', gap: 18, flex: 1, alignItems: 'flex-start' }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div>
            <h1 className="h1">Your reports</h1>
            <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
              Six roads you flagged. Two got fixed. One came back.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn>All wards</Btn>
            <Btn>Last 90 days</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            ['96', 'detections sent', undefined],
            ['11', 'became tickets', undefined],
            ['2', 'fixed because of you', color.green],
            ['1', 'reopened after repair', color.red],
            ['13 days', 'median time to fix', undefined],
          ].map(([v, l, c]) => (
            <Panel key={l} style={{ padding: '12px 14px' }}>
              <div className="num" style={{ fontSize: 26, color: (c as string) ?? color.c.ink }}>
                {v}
              </div>
              <div className="tiny" style={{ color: color.c.muted, marginTop: 6 }}>
                {l}
              </div>
            </Panel>
          ))}
        </div>

        <Panel flush>
          <div style={{ padding: '12px 12px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ ...TH, width: 64 }}>
                    Evidence
                  </th>
                  <th scope="col" style={TH}>Ticket</th>
                  <th scope="col" style={TH}>Where</th>
                  <th scope="col" style={TH}>Status</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>SLA</th>
                </tr>
              </thead>
              <tbody>
                {MY_REPORTS.map((r, i) => (
                  <tr key={r.id}>
                    <td style={TD}>
                      <EvidenceFrame width={52} height={34} kind={r.kind} far seed={90 + i} radius={6} />
                    </td>
                    <td style={TD}>
                      <span className="mono">{r.id}</span>
                    </td>
                    <td style={TD}>
                      <div style={{ fontWeight: 500 }}>{r.where}</div>
                      <div className="tiny" style={{ color: color.c.muted, marginTop: 3 }}>
                        {r.klass} · first sent {r.sent}
                      </div>
                    </td>
                    <td style={TD}>
                      <Chip tone={r.tone}>{r.status}</Chip>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: toneColor(r.tone, 'light') }}>
                      {r.sla}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="rs-row" style={{ display: 'flex', gap: 14 }}>
          <Panel flush className="rs-fixed" style={{ width: 452, flexShrink: 0 }}>
            <PanelHead title="Roads you have sensed" />
            <RoadMap width={450} height={236} theme="light" coverage labels={false} seed={8} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                gap: 10,
              }}
            >
              <span className="tiny" style={{ color: color.c.muted }}>
                You cover 214 km of Guwahati regularly
              </span>
              <Chip tone="brand">9% of the city network</Chip>
            </div>
          </Panel>

          <Panel style={{ flex: 1, minWidth: 0 }}>
            <PanelHead title="What you sent, week by week" />
            <PanelBody>
              <BarChart
                data={[12, 18, 9, 24, 31, 17, 26, 38, 22]}
                labels={['Jul 7', '', '', '', '', '', '', '', 'Sep 1']}
                width={400}
                height={106}
                theme="light"
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <Inset style={{ flex: 1 }}>
                  <div className="num" style={{ fontSize: 19 }}>
                    3 of 11
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
                    of your tickets are still open
                  </div>
                </Inset>
                <Inset style={{ flex: 1 }}>
                  <div className="num" style={{ fontSize: 19 }}>
                    1.9 km
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
                    of road repaired after your reports
                  </div>
                </Inset>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>

      {/* right column */}
      <div className="rs-fixed" style={{ width: 352, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Panel>
          <PanelHead title="Evidence vault" />
          <PanelBody style={{ paddingTop: 8 }}>
            <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.5 }}>
              Timestamped, geotagged proof of road condition. Useful when a claim needs it.
            </p>
            <div style={{ marginTop: 10 }}>
              {VAULT.map((v, i) => (
                <div
                  key={v.text}
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < VAULT.length - 1 ? '1px solid #F5F5F5' : undefined,
                  }}
                >
                  <EvidenceFrame width={64} height={42} kind={v.kind} far seed={100 + i} radius={7} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, letterSpacing: '-0.011em' }}>
                      {v.text}
                    </span>
                    <span className="mono" style={{ color: color.c.muted, display: 'block', marginTop: 4 }}>
                      02 Sep · 08:14
                    </span>
                    <span className="mono" style={{ color: color.c.dim, display: 'block', marginTop: 2 }}>
                      26.1445°N 91.7898°E
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <Btn style={{ marginTop: 12 }}>Export a dated report</Btn>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Damage you found, by type" />
          <PanelBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Gauge value={96} max={100} size={120} theme="light" color={color.mark} caption="detections" />
              <div style={{ flex: 1, minWidth: 0 }}>
                {BY_TYPE.map((b) => (
                  <div
                    key={b.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}
                  >
                    <Dot tone={b.tone} size={7} />
                    <span style={{ flex: 1, fontSize: 12.5 }}>{b.label}</span>
                    <span className="num" style={{ fontSize: 14 }}>
                      {b.n}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Road Guardian" />
          <PanelBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: color.mark,
                  color: '#0A0A0A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconShield size={22} />
              </span>
              <span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, letterSpacing: '-0.014em' }}>
                  2,480 points · Level 3
                </span>
                <span className="tiny" style={{ color: color.c.muted }}>
                  14th in Dispur ward, 96th in Guwahati
                </span>
              </span>
            </div>
            <Bar value={64} color={color.mark} style={{ marginTop: 12 }} />
            <div className="tiny" style={{ color: color.c.muted, marginTop: 7 }}>
              220 points to Level 4
            </div>
            <div style={{ marginTop: 12 }}>
              {[
                ['Fuel discount at partner pumps', '5%'],
                ['Free annual vehicle health check', '1'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: `1px solid ${color.c.lineSoft}`,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: color.c.muted }}>{k}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
