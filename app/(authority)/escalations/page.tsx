'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, Chip, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { BarChart, LineChart } from '@/components/data/Charts';
import { BREACH_WEEKS, ESCALATIONS, LADDER, SIT_TIME } from '@/lib/fixtures/escalations';
import { color, toneColor } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 10px',
  borderBottom: `1px solid ${color.a.line}`,
};
const TD: React.CSSProperties = {
  padding: '10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink2,
};

export default function EscalationsPage() {
  const [selected, setSelected] = useState('z3');
  const reason = useFilterState(['never', 'missed', 'reopened']);

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Escalation reason"
          checked={reason.checked}
          onToggle={reason.toggle}
          items={[
            { id: 'never', label: 'Never acknowledged', count: 18 },
            { id: 'missed', label: 'Fix deadline missed', count: 41 },
            { id: 'reopened', label: 'Reopened after repair', count: 9 },
            { id: 'nostart', label: 'Contractor did not start', count: 6 },
          ]}
        />
        <SidePanel title="Clock settings">
          <p className="sub" style={{ color: color.a.muted, fontSize: 12.5 }}>
            Arterial roads: acknowledge in 2 days, fix in 7. Local streets: 3 and 14. Damage within
            300 m of a school or hospital halves both.
          </p>
          <Btn small style={{ marginTop: 11 }}>
            Edit deadlines
          </Btn>
        </SidePanel>
      </Sidebar>

      <Main>
        <PageHead
          title="Escalation ladder"
          sub="A ticket nobody touches does not go quiet, it goes upward. Every step is logged and published."
          right={
            <>
              <Btn>This month</Btn>
              <Btn primary>Acknowledge 6 tickets</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="Escalated this month" value={16} tone="amber" sub="from 412 open tickets" />
          <KpiTile label="Sitting above ward level" value={16} sub="no longer your clock" />
          <KpiTile label="Reached the commissioner" value={3} tone="red" sub="two are over 20 days" />
          <KpiTile label="Published as breaches" value={74} tone="red" sub="city-wide, all authorities" />
          <KpiTile label="Never escalated" value="82%" tone="green" sub="closed inside the deadline" />
        </KpiRow>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {LADDER.map((l, i) => (
            <React.Fragment key={l.level}>
              <Panel
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '13px 14px',
                  borderColor: l.breached > 0 && l.level < 5 ? '#2A1614' : color.a.line,
                  background: l.level === 5 ? '#0D0B07' : color.a.panel,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tiny" style={{ color: color.a.dim }}>
                    Level {l.level}
                  </span>
                  {l.breached > 0 ? (
                    <Chip tone={l.level === 5 ? 'brand' : 'red'}>{l.breached} breached</Chip>
                  ) : null}
                </div>
                <div className="h2" style={{ color: color.a.ink, marginTop: 10, minHeight: 38 }}>
                  {l.name}
                </div>
                <div className="tiny" style={{ color: color.a.muted, marginTop: 4 }}>
                  {l.owner}
                </div>
                <div className="num" style={{ fontSize: 30, marginTop: 12, color: toneColor(l.tone, 'dark') }}>
                  {l.count}
                </div>
                <div className="tiny" style={{ color: color.a.dim, marginTop: 4 }}>
                  tickets sitting here
                </div>
                <div style={{ height: 1, background: color.a.lineSoft, margin: '12px 0 10px' }} />
                <div className="tiny" style={{ color: color.a.muted, lineHeight: 1.45 }}>
                  {l.rule}
                </div>
              </Panel>
              {i < LADDER.length - 1 ? (
                <div
                  aria-hidden
                  style={{
                    width: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `1px solid ${color.a.border}`,
                      color: color.a.dim,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>

        <Panel flush style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHead
            title="Escalations this month"
            right={<Chip tone="blue">Each row is hash chained and public</Chip>}
          />
          <div className="scrollarea" style={{ flex: 1, minHeight: 0, padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Ticket</th>
                  <th scope="col" style={TH}>Road</th>
                  <th scope="col" style={TH}>Moved</th>
                  <th scope="col" style={TH}>When</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {ESCALATIONS.map((e) => (
                  <tr key={e.id}>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.ink }}>
                        {e.id}
                      </span>
                    </td>
                    <td style={TD}>{e.road}</td>
                    <td style={TD}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: color.a.muted }}>{e.from}</span>
                        <span style={{ color: color.mark }} aria-label="escalated to">
                          →
                        </span>
                        <span style={{ color: color.a.ink }}>{e.to}</span>
                      </span>
                    </td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.dim }}>
                        {e.at}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <Chip tone="red">{e.over} d over</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Panel>
            <PanelHead title="How long a ticket sits at each level" sub="Median days" />
            <PanelBody>
              <BarChart
                data={SIT_TIME.data}
                labels={SIT_TIME.labels}
                width={480}
                height={100}
                theme="dark"
              />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHead title="Breaches published per week" />
            <PanelBody>
              <LineChart
                series={[{ data: BREACH_WEEKS, color: color.red }]}
                labels={['Jul 7', '', '', '', '', '', '', '', 'Sep 1']}
                width={480}
                height={100}
                theme="dark"
              />
            </PanelBody>
          </Panel>
        </div>
      </Main>
    </>
  );
}
