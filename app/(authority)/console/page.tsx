'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import {
  Bar,
  Btn,
  Chip,
  KpiRow,
  KpiTile,
  Panel,
  PanelBody,
  PanelHead,
  SlaPlate,
} from '@/components/system';
import RoadMap from '@/components/data/RoadMap';
import { BarChart } from '@/components/data/Charts';
import { useRole } from '@/components/chrome/RoleContext';
import { INCOMING, INCOMING_STREAM, NEEDS_YOU } from '@/lib/fixtures/tickets';
import { color, toneColor } from '@/lib/tokens';

const POINTS = [
  { x: 0.47, y: 0.47, sev: 'critical' as const, ring: true, badge: '4' },
  { x: 0.6, y: 0.46, sev: 'critical' as const, ring: true },
  { x: 0.52, y: 0.63, sev: 'high' as const, badge: '3' },
  { x: 0.4, y: 0.55, sev: 'high' as const },
  { x: 0.68, y: 0.44, sev: 'medium' as const },
  { x: 0.34, y: 0.72, sev: 'critical' as const },
  { x: 0.55, y: 0.8, sev: 'medium' as const },
  { x: 0.75, y: 0.62, sev: 'low' as const },
  { x: 0.3, y: 0.31, sev: 'high' as const },
  { x: 0.63, y: 0.29, sev: 'good' as const },
  { x: 0.8, y: 0.72, sev: 'medium' as const },
  { x: 0.44, y: 0.36, sev: 'low' as const },
  { x: 0.5, y: 0.53, sev: 'new' as const, ring: true },
];

const DAILY = [4, 7, 3, 9, 12, 6, 11, 18, 14, 9, 21, 16, 12, 24];
const DAILY_LABELS = ['21', '', '', '', '', '', '', '', '', '', '', '', '', '3'];

const WHERE = [
  { label: 'Waiting for you to acknowledge', n: 6, tone: 'red' as const, pct: 32 },
  { label: 'Assigned, work not started', n: 11, tone: 'amber' as const, pct: 55 },
  { label: 'Work in progress', n: 19, tone: 'brand' as const, pct: 82 },
  { label: 'Repaired, waiting on verification', n: 8, tone: 'blue' as const, pct: 40 },
];

export default function ConsolePage() {
  const { role } = useRole();
  const cls = useFilterState(['pothole', 'alligator']);
  const state = useFilterState(['ack', 'assigned', 'verifying']);
  const [selected, setSelected] = useState(role.selected);
  useEffect(() => setSelected(role.selected), [role.selected]);

  const [feed, setFeed] = useState(INCOMING);
  const [open, setOpen] = useState(role.kpi.open);
  useEffect(() => setOpen(role.kpi.open), [role.kpi.open]);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const next = INCOMING_STREAM[i % INCOMING_STREAM.length];
      i += 1;
      const now = new Date();
      const at = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFeed((f) => [{ at, ...next }, ...f].slice(0, 4));
      setOpen((n) => n + 1);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Damage class"
          checked={cls.checked}
          onToggle={cls.toggle}
          items={[
            { id: 'pothole', label: 'Pothole', count: 38 },
            { id: 'alligator', label: 'Alligator crack', count: 14 },
            { id: 'longitudinal', label: 'Longitudinal crack', count: 7 },
            { id: 'transverse', label: 'Transverse crack', count: 3 },
          ]}
        />
        <FilterGroup
          title="Ticket state"
          checked={state.checked}
          onToggle={state.toggle}
          items={[
            { id: 'ack', label: 'Awaiting acknowledgement', count: 6 },
            { id: 'assigned', label: 'Assigned', count: 19 },
            { id: 'verifying', label: 'Repaired, verifying', count: 8 },
            { id: 'closed', label: 'Closed this month', count: 23 },
          ]}
        />
        <SidePanel title="Sensing fleet, today">
          {[
            ['Vehicles sensing', '118'],
            ['Ward covered', '61%'],
            ['GMC trucks', '14'],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}
            >
              <span style={{ fontSize: 12.5, color: color.a.muted }}>{k}</span>
              <span className="mono" style={{ color: color.a.ink }}>
                {v}
              </span>
            </div>
          ))}
        </SidePanel>
      </Sidebar>

      <Main>
        <PageHead
          title={role.id === 'ward_engineer' ? 'Ward 32 this morning' : `${role.scope} this morning`}
          sub={`${role.kpi.open} open damages. ${role.kpi.breached} of them are past a deadline you own.`}
          right={
            <>
              <Btn>Last 30 days</Btn>
              <Btn primary>Raise work order</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="Open damage" value={open} sub="24 raised this week" />
          <KpiTile label="Past deadline" value={role.kpi.breached} tone="red" sub="2 escalated above you" />
          <KpiTile label="Fixed, verifying" value={role.kpi.verifying} tone="blue" sub="waiting on clean passes" />
          <KpiTile label="Closed this month" value={role.kpi.closed} tone="green" sub="median 14 days" />
          <KpiTile label="Ward road health" value={role.kpi.health} tone="amber" sub="down 11 since June" />
        </KpiRow>

        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', height: 510, flexShrink: 0 }}>
          <Panel flush style={{ width: 694, flexShrink: 0 }}>
            <PanelHead
              title="Ward 32 · damage and road condition"
              sub="Amber roads driven in last 24 h"
              right={
                <Chip tone="brand" dot>
                  Live
                </Chip>
              }
            />
            <RoadMap width={692} height={462} theme="dark" points={POINTS} rci coverage seed={4} />
          </Panel>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Panel style={{ flexShrink: 0 }}>
              <PanelHead title="Needs you today" right={<Chip tone="red">6 breaching</Chip>} />
              <PanelBody style={{ padding: '2px 14px 4px' }}>
                {NEEDS_YOU.map((n, i) => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: i < NEEDS_YOU.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                    }}
                  >
                    <SlaPlate value={n.days} unit={n.unit} tone={n.tone} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          letterSpacing: '-0.011em',
                          color: color.a.ink,
                        }}
                      >
                        {n.road}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 4 }}>
                        <span className="tiny" style={{ color: color.a.muted }}>
                          {n.note}
                        </span>
                        <span className="mono" style={{ color: color.a.dim }}>
                          {n.id}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </PanelBody>
            </Panel>

            <Panel style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <PanelHead
                title="Detections coming in"
                right={
                  <span className="tiny" style={{ color: color.a.dim }}>
                    Deduplicated
                  </span>
                }
              />
              <PanelBody className="scrollarea" style={{ padding: '4px 14px 8px', flex: 1, minHeight: 0 }}>
                <div aria-live="polite" aria-relevant="additions">
                  {feed.map((d, i) => (
                    <div
                      key={`${d.at}-${d.road}-${i}`}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'baseline',
                        padding: '6px 0',
                        borderBottom: i < feed.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                      }}
                    >
                      <span className="mono" style={{ color: color.a.dim, width: 38, flexShrink: 0 }}>
                        {d.at}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 13,
                            color: color.a.ink,
                            letterSpacing: '-0.011em',
                            lineHeight: 1.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.road}
                        </span>
                        <span className="tiny" style={{ color: color.a.muted, display: 'block', lineHeight: 1.3 }}>
                          {d.klass} · agreed by {d.vehicles} vehicles
                        </span>
                      </span>
                      <span className="mono" style={{ color: color.mark }}>
                        {d.conf}
                      </span>
                    </div>
                  ))}
                </div>
              </PanelBody>
            </Panel>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, height: 212, flexShrink: 0 }}>
          <Panel style={{ width: 694, flexShrink: 0 }}>
            <PanelHead title="Damage found in Ward 32, by day" sub="Last two weeks" />
            <PanelBody>
              <BarChart
                data={DAILY}
                labels={DAILY_LABELS}
                width={664}
                height={104}
                theme="dark"
                highlight={[DAILY.length - 1]}
              />
            </PanelBody>
          </Panel>
          <Panel style={{ flex: 1, minWidth: 0 }}>
            <PanelHead title="Where your open tickets sit" sub="62 open" />
            <PanelBody style={{ paddingTop: 4 }}>
              {WHERE.map((w) => (
                <div key={w.label} style={{ marginBottom: 7 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: color.a.ink2, letterSpacing: '-0.011em' }}>
                      {w.label}
                    </span>
                    <span className="num" style={{ fontSize: 15, color: toneColor(w.tone, 'dark') }}>
                      {w.n}
                    </span>
                  </div>
                  <Bar value={w.pct} tone={w.tone} />
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
      </Main>
    </>
  );
}
