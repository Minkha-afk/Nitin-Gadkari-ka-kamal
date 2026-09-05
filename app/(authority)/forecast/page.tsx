'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import { Bar, Btn, Chip, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import RoadMap from '@/components/data/RoadMap';
import { BarChart, LineChart } from '@/components/data/Charts';
import {
  DO_NOTHING,
  DRIVERS,
  FORECAST,
  FORECAST_LABELS,
  RAINFALL,
  SEAL_NOW,
} from '@/lib/fixtures/forecast';
import { inr } from '@/lib/fixtures/contractors';
import { color, toneColor } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 10px',
  borderBottom: `1px solid ${color.a.line}`,
};
const TD: React.CSSProperties = {
  padding: '11px 10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink2,
  verticalAlign: 'middle',
};

const FORECAST_POINTS = [
  { x: 0.47, y: 0.47, sev: 'critical' as const, ring: true },
  { x: 0.5, y: 0.62, sev: 'critical' as const },
  { x: 0.33, y: 0.72, sev: 'high' as const },
  { x: 0.62, y: 0.44, sev: 'high' as const },
  { x: 0.72, y: 0.6, sev: 'medium' as const },
  { x: 0.86, y: 0.94, sev: 'medium' as const },
  { x: 0.3, y: 0.31, sev: 'good' as const },
  { x: 0.79, y: 0.72, sev: 'low' as const },
];

export default function ForecastPage() {
  const [selected, setSelected] = useState('z3');
  const win = useFilterState(['6w']);
  const sig = useFilterState(['crack', 'rain', 'age']);

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Forecast window"
          checked={win.checked}
          onToggle={win.toggle}
          items={[
            { id: '4w', label: '4 weeks', count: 18 },
            { id: '6w', label: '6 weeks', count: 34 },
            { id: '12w', label: '12 weeks', count: 61 },
          ]}
        />
        <FilterGroup
          title="Signal"
          checked={sig.checked}
          onToggle={sig.toggle}
          items={[
            { id: 'crack', label: 'Crack spreading between passes', count: 22 },
            { id: 'rain', label: 'Rain forecast above normal', count: 31 },
            { id: 'age', label: 'Last resurfaced over 5 years ago', count: 17 },
            { id: 'heavy', label: 'Heavy vehicle route', count: 9 },
          ]}
        />
        <SidePanel title="Rainfall, Guwahati">
          <BarChart
            data={RAINFALL.data}
            labels={RAINFALL.labels}
            width={202}
            height={78}
            theme="dark"
            accent={color.blue}
          />
          <p className="tiny" style={{ color: color.a.muted, marginTop: 10, lineHeight: 1.5 }}>
            A wet October is forecast. Cracks left open now become potholes before December.
          </p>
        </SidePanel>
      </Sidebar>

      <Main>
        <PageHead
          title="What will break next"
          sub="Cracks widening across repeated passes, weighed against road age and the rain forecast."
          right={
            <>
              <Btn>6 week window</Btn>
              <Btn primary>Build repair plan</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="Segments likely to fail" value={34} tone="amber" sub="within 6 weeks" />
          <KpiTile label="Length at risk" value="18.4 km" sub="of 214 km in Zone 3" />
          <KpiTile label="Cost to seal now" value="₹ 41 L" tone="green" sub="crack sealing and patching" />
          <KpiTile label="Cost if left to fail" value="₹ 1.6 Cr" tone="red" sub="full rebuild after monsoon" />
          <KpiTile label="Model accuracy" value="0.79" tone="blue" sub="on last season's outcomes" />
        </KpiRow>

        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', height: 402, flexShrink: 0 }}>
          <Panel flush style={{ width: 692, flexShrink: 0 }}>
            <PanelHead
              title="Predicted condition in 6 weeks"
              right={
                <span style={{ display: 'flex', gap: 6 }}>
                  <Chip tone="red" dot>Will fail</Chip>
                  <Chip tone="amber" dot>Will deteriorate</Chip>
                  <Chip tone="green" dot>Will hold</Chip>
                </span>
              }
            />
            <RoadMap width={690} height={354} theme="dark" rci points={FORECAST_POINTS} seed={12} />
          </Panel>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Panel>
              <PanelHead title="Condition index, Zone 3" sub="Do nothing vs seal now" />
              <PanelBody>
                <LineChart
                  width={370}
                  height={104}
                  theme="dark"
                  labels={['now', '', '', '', '+4w', '', '', '', '+8w']}
                  series={[
                    { data: DO_NOTHING, color: color.amber },
                    { data: SEAL_NOW, color: color.greenLift, dash: '4 4' },
                  ]}
                />
              </PanelBody>
            </Panel>
            <Panel style={{ flex: 1 }}>
              <PanelHead title="What drives the forecast" />
              <PanelBody style={{ paddingTop: 8 }}>
                {DRIVERS.map((d) => (
                  <div key={d.label} style={{ marginBottom: 11 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: color.a.ink2 }}>{d.label}</span>
                      <span className="mono" style={{ color: toneColor(d.tone, 'dark') }}>
                        {d.value.toFixed(2)}
                      </span>
                    </div>
                    <Bar value={d.bar} tone={d.tone} />
                  </div>
                ))}
              </PanelBody>
            </Panel>
          </div>
        </div>

        <Panel flush style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHead
            title="Segments to treat before the next rain"
            right={
              <span className="tiny" style={{ color: color.a.dim }}>
                Ranked by cost avoided
              </span>
            }
          />
          <div className="scrollarea" style={{ flex: 1, minHeight: 0, padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Segment</th>
                  <th scope="col" style={TH}>Condition today and forecast</th>
                  <th scope="col" style={TH}>Risk</th>
                  <th scope="col" style={TH}>Seal now</th>
                  <th scope="col" style={TH}>Rebuild later</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Plan</th>
                </tr>
              </thead>
              <tbody>
                {FORECAST.map((f) => (
                  <tr key={f.segmentId}>
                    <td style={{ ...TD, color: color.a.ink }}>
                      <div style={{ fontWeight: 500 }}>{f.name}</div>
                      <div className="tiny" style={{ color: color.a.muted, marginTop: 3 }}>
                        {f.lengthKm} km · {f.note}
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="num" style={{ fontSize: 19, color: color.a.ink }}>
                          {f.rciNow}
                        </span>
                        <span style={{ color: color.a.dim }}>→</span>
                        <span
                          className="num"
                          style={{
                            fontSize: 19,
                            color: f.rciForecast < 35 ? color.redLift : color.amber,
                          }}
                        >
                          {f.rciForecast}
                        </span>
                      </div>
                      <div className="tiny" style={{ color: color.a.dim, marginTop: 3 }}>
                        index in 6 weeks
                      </div>
                    </td>
                    <td style={TD}>
                      <Chip tone={f.failureRisk >= 0.8 ? 'red' : 'amber'}>
                        {Math.round(f.failureRisk * 100)}%
                      </Chip>
                    </td>
                    <td style={TD}>
                      <div className="mono" style={{ color: color.greenLift, fontSize: 12.5 }}>
                        ₹ {(f.costSealNow / 100000).toFixed(1)} L
                      </div>
                      <div className="tiny" style={{ color: color.a.dim, marginTop: 3 }}>
                        seal now
                      </div>
                    </td>
                    <td style={TD}>
                      <div className="mono" style={{ color: color.redLift, fontSize: 12.5 }}>
                        ₹ {(f.costRebuildLater / 100000).toFixed(1)} L
                      </div>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <Btn small>Add</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Main>
    </>
  );
}
