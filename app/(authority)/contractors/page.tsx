'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import { Avatar, Bar, Btn, Chip, KpiRow, KpiTile, Panel, PanelHead } from '@/components/system';
import { CONTRACTORS, WORK_ORDERS, inr } from '@/lib/fixtures/contractors';
import { color, reliabilityTone, toneColor, type Tone } from '@/lib/tokens';

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

export default function ContractorsPage() {
  const [selected, setSelected] = useState('z3');
  const panel = useFilterState(['gmc', 'pwd', 'flagged']);
  const wo = useFilterState(['start', 'progress', 'verifying', 'reopened']);

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Panel"
          checked={panel.checked}
          onToggle={panel.toggle}
          items={[
            { id: 'gmc', label: 'GMC empanelled', count: 14 },
            { id: 'pwd', label: 'PWD panel', count: 6 },
            { id: 'flagged', label: 'Flagged, under review', count: 2 },
          ]}
        />
        <FilterGroup
          title="Work order state"
          checked={wo.checked}
          onToggle={wo.toggle}
          items={[
            { id: 'start', label: 'Awaiting start', count: 11 },
            { id: 'progress', label: 'In progress', count: 19 },
            { id: 'verifying', label: 'Repaired, verifying', count: 8 },
            { id: 'reopened', label: 'Reopened in warranty', count: 2 },
          ]}
        />
        <SidePanel title="Warranty rule">
          <p className="sub" style={{ color: color.a.muted, fontSize: 12.5 }}>
            If the same damage is detected again within 180 days of a verified closure, the work
            order reopens at the contractor&rsquo;s cost and their reliability score drops.
          </p>
        </SidePanel>
      </Sidebar>

      <Main>
        <PageHead
          title="Contractors and work orders"
          sub="Reliability is not self-reported. It is how many of their repairs survived the traffic."
          right={
            <>
              <Btn>Rate card</Btn>
              <Btn primary>New work order</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="Active work orders" value={40} sub="across Zone 3" />
          <KpiTile label="Committed this month" value="₹ 48.2 L" sub="against ₹ 62 L budget" />
          <KpiTile label="Repairs that came back" value={12} tone="red" sub="inside the warranty window" />
          <KpiTile label="Median time to repair" value="7.4 d" sub="from assignment to verified" />
          <KpiTile label="Cost per verified m²" value="₹ 12,470" tone="green" sub="down 6% since April" />
        </KpiRow>

        <Panel flush>
          <PanelHead
            title="Contractor performance"
            right={
              <span className="tiny" style={{ color: color.a.dim }}>
                Last 12 months
              </span>
            }
          />
          <div style={{ padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Contractor</th>
                  <th scope="col" style={TH}>Closed</th>
                  <th scope="col" style={TH}>Came back</th>
                  <th scope="col" style={TH}>Reliability</th>
                  <th scope="col" style={TH}>Speed</th>
                  <th scope="col" style={TH}>Rate</th>
                  <th scope="col" style={TH}>Load</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {CONTRACTORS.map((c) => {
                  const tone: Tone = reliabilityTone(c.reliability);
                  return (
                    <tr key={c.id}>
                      <td style={{ ...TD, color: color.a.ink }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={c.name.slice(0, 1)} />
                          <span>
                            <span style={{ display: 'block', fontWeight: 500 }}>{c.name}</span>
                            <span className="tiny" style={{ color: color.a.muted }}>
                              {c.panel} · since {c.since}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td style={TD}>
                        <span className="mono">{c.jobsClosed}</span>
                      </td>
                      <td style={TD}>
                        <span className="mono" style={{ color: c.cameBack > 3 ? color.redLift : color.a.ink2 }}>
                          {c.cameBack}
                        </span>
                      </td>
                      <td style={{ ...TD, width: 150 }}>
                        <div className="num" style={{ fontSize: 16, color: toneColor(tone, 'dark') }}>
                          {c.reliability.toFixed(2)}
                        </div>
                        <Bar value={c.reliability * 100} tone={tone} width={110} style={{ marginTop: 6 }} />
                        <div className="tiny" style={{ color: color.a.dim, marginTop: 5 }}>
                          from verified closures
                        </div>
                      </td>
                      <td style={TD}>
                        <span className="mono">{c.medianDays} d</span>
                      </td>
                      <td style={TD}>
                        <span className="mono">₹ {inr(c.ratePerM2)}</span>
                      </td>
                      <td style={TD}>
                        <Chip>{c.openLoad} open</Chip>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        {c.cameBack > 3 ? <Chip tone="red">Flagged</Chip> : <Btn small>Assign work</Btn>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel flush style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHead
            title="Work orders"
            right={
              <span className="tiny" style={{ color: color.a.dim }}>
                Generated from tickets, priced from the rate card
              </span>
            }
          />
          <div className="scrollarea" style={{ flex: 1, minHeight: 0, padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Work order</th>
                  <th scope="col" style={TH}>Where</th>
                  <th scope="col" style={TH}>Contractor</th>
                  <th scope="col" style={TH}>Amount</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {WORK_ORDERS.map((w) => (
                  <tr key={w.id}>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.ink }}>
                        {w.id}
                      </span>
                    </td>
                    <td style={TD}>
                      {w.location} · {w.areaM2} m²
                    </td>
                    <td style={TD}>{w.contractorName}</td>
                    <td style={TD}>
                      <span className="mono">₹ {inr(w.amount)}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <Chip tone={w.tone as Tone}>{w.state}</Chip>
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
