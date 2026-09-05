'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import { Main, PageHead } from '@/components/system/Page';
import { Bar, Btn, Chip, Dot, KpiRow, KpiTile, Panel, PanelHead } from '@/components/system';
import { useRole } from '@/components/chrome/RoleContext';
import { QUEUE, type QueueRow } from '@/lib/fixtures/tickets';
import { CLASS_SEVERITY } from '@/lib/types';
import { color, severityTone, slaTone, toneColor } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 10px',
  borderBottom: `1px solid ${color.a.line}`,
  whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '11px 10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink,
  verticalAlign: 'middle',
};

function Deadline({ row }: { row: QueueRow }) {
  const tone = slaTone(row.daysOver, row.daysLeft);
  const over = (row.daysOver ?? 0) > 0;
  const days = over ? row.daysOver! : row.daysLeft!;
  const pct = over ? 100 : Math.max(12, 100 - days * 9);
  return (
    <div style={{ width: 96 }}>
      <Chip tone={tone}>{over ? `${days} d over` : `${days} d left`}</Chip>
      <Bar value={pct} tone={tone} style={{ marginTop: 7 }} />
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const { role } = useRole();
  const [selected, setSelected] = useState(role.selected);
  const [picked, setPicked] = useState<Record<string, boolean>>({
    'GMC-W32-2461': true,
    'GMC-W32-2455': true,
    'GMC-W32-2483': true,
  });

  const prio = useFilterState(['critical', 'high']);
  const state = useFilterState(['new', 'ack', 'assigned', 'reopened']);
  const conf = useFilterState(['hi', 'mid', 'lo']);

  const rows = useMemo(() => {
    return QUEUE.filter((r) => {
      const p =
        (prio.checked.critical && r.priority === 'critical') ||
        (prio.checked.high && r.priority === 'high') ||
        (prio.checked.medium && r.priority === 'medium') ||
        (prio.checked.low && r.priority === 'low');
      const c =
        (conf.checked.hi && r.confidence >= 0.9) ||
        (conf.checked.mid && r.confidence >= 0.7 && r.confidence < 0.9) ||
        (conf.checked.lo && r.confidence < 0.7);
      return p && c;
    });
  }, [prio.checked, conf.checked]);

  const count = Object.values(picked).filter(Boolean).length;

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Priority"
          checked={prio.checked}
          onToggle={prio.toggle}
          items={[
            { id: 'critical', label: 'Critical · schools, hospitals', count: 4 },
            { id: 'high', label: 'High · arterial road', count: 18 },
            { id: 'medium', label: 'Medium · collector road', count: 26 },
            { id: 'low', label: 'Low · local street', count: 14 },
          ]}
        />
        <FilterGroup
          title="State"
          checked={state.checked}
          onToggle={state.toggle}
          items={[
            { id: 'new', label: 'New, not acknowledged', count: 6 },
            { id: 'ack', label: 'Acknowledged', count: 9 },
            { id: 'assigned', label: 'Assigned to contractor', count: 19 },
            { id: 'verifying', label: 'Repaired, verifying', count: 8 },
            { id: 'reopened', label: 'Reopened', count: 2 },
          ]}
        />
        <FilterGroup
          title="Confidence"
          checked={conf.checked}
          onToggle={conf.toggle}
          items={[
            { id: 'hi', label: 'Above .90 · act now', count: 21 },
            { id: 'mid', label: '.70 to .90', count: 28 },
            { id: 'lo', label: 'Below .70 · needs a pass', count: 13 },
          ]}
        />
      </Sidebar>

      <Main>
        <PageHead
          title="Ticket queue"
          sub="Sorted by how close each one is to breaching its deadline."
          right={
            <>
              <Btn>Sort: deadline</Btn>
              <Btn>Export</Btn>
              <Btn primary>Bulk assign</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="In your queue" value={role.queue} sub={`across ${role.scope}`} />
          <KpiTile label="Breached" value={role.kpi.breached} tone="red" sub="visible on the public board" />
          <KpiTile label="Due within 48 hours" value={9} tone="amber" sub="acknowledge or assign" />
          <KpiTile label="Unassigned" value={12} sub="no contractor yet" />
          <KpiTile label="Estimated repair cost" value="₹18.4 L" sub="from area and rate card" />
        </KpiRow>

        <Panel flush style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderBottom: `1px solid ${color.a.line}`,
            }}
          >
            <Chip tone="brand">{count} selected</Chip>
            <span style={{ fontSize: 12.5, color: color.a.muted }}>Assign to</span>
            <Btn small>Luit Roadworks</Btn>
            <Btn small>Set priority</Btn>
            <span style={{ flex: 1 }} />
            <span className="tiny" style={{ color: color.a.dim }}>
              Showing {rows.length} of {role.queue}
            </span>
          </div>

          <div className="scrollarea" style={{ flex: 1, minHeight: 0, padding: '10px 4px 4px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ ...TH, width: 34 }}>
                    <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
                      Select
                    </span>
                  </th>
                  <th scope="col" style={TH}>Ticket</th>
                  <th scope="col" style={TH}>Location</th>
                  <th scope="col" style={TH}>Damage</th>
                  <th scope="col" style={TH}>Conf.</th>
                  <th scope="col" className="rs-drop-2" style={TH}>Agreement</th>
                  <th scope="col" className="rs-drop-1" style={TH}>Sitting with</th>
                  <th scope="col" style={TH}>Deadline</th>
                  <th scope="col" className="rs-drop-3" style={TH}>Contractor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/tickets/${r.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ ...TD, paddingRight: 0 }}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.id}`}
                        checked={!!picked[r.id]}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setPicked((p) => ({ ...p, [r.id]: !p[r.id] }))}
                        style={{ accentColor: '#FAFAFA', width: 14, height: 14 }}
                      />
                    </td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.ink }}>
                        {r.id}
                      </span>
                    </td>
                    <td style={{ ...TD, maxWidth: 240 }}>{r.location}</td>
                    <td style={TD}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Dot tone={severityTone[CLASS_SEVERITY[r.damageClass]]} size={7} />
                        <span style={{ color: color.a.ink2 }}>{r.damageLabel}</span>
                      </span>
                    </td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.mark }}>
                        {r.confidence.toFixed(2).slice(1)}
                      </span>
                    </td>
                    <td className="rs-drop-2" style={TD}>
                      <span className="mono" style={{ color: color.a.ink2 }}>
                        {r.passes} passes
                      </span>
                    </td>
                    <td className="rs-drop-1" style={{ ...TD, color: color.a.ink2 }}>{r.sittingWith}</td>
                    <td style={TD}>
                      <Deadline row={r} />
                    </td>
                    <td className="rs-drop-3" style={{ ...TD, color: r.contractor ? color.a.ink2 : color.a.dim }}>
                      {r.contractor ?? 'Unassigned'}
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
