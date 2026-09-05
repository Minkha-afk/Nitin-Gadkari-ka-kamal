'use client';

import React from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, Panel } from '@/components/system';
import ExportMenu from './ExportMenu';
import { NotConfigured, STATE_LABEL, TicketTable } from './bits';
import type { TicketRow } from '@/lib/authority';
import { color } from '@/lib/tokens';
import { CLASS_LABEL, type DamageClass, type Severity, type TicketState } from '@/lib/types';

const STATES: TicketState[] = ['new', 'acknowledged', 'assigned', 'repaired', 'verified', 'closed', 'reopened'];
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

export default function QueueClient({
  rows,
  total,
  configured,
  scopeLabel,
}: {
  rows: TicketRow[];
  total: number;
  configured: boolean;
  scopeLabel: string;
}) {
  const [states, setStates] = React.useState<TicketState[]>([]);
  const [severities, setSeverities] = React.useState<Severity[]>([]);
  const [classes, setClasses] = React.useState<DamageClass[]>([]);
  const [escalatedOnly, setEscalatedOnly] = React.useState(false);

  // Filtering happens here rather than in the query: the whole jurisdiction is
  // already loaded, and a round trip per checkbox would be slower than the sort.
  const shown = rows.filter(
    (r) =>
      (!states.length || states.includes(r.state)) &&
      (!severities.length || severities.includes(r.severity)) &&
      (!classes.length || classes.includes(r.damageClass)) &&
      (!escalatedOnly || r.escalated),
  );

  const classesPresent = [...new Set(rows.map((r) => r.damageClass))];

  return (
    <>
      <Sidebar>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>Jurisdiction</div>
          <JurisdictionTree />
        </div>
        <Facet label="State" options={STATES.map((s) => [s, STATE_LABEL[s]] as const)} selected={states} onToggle={(v) => setStates(toggle(states, v))} />
        <Facet label="Severity" options={SEVERITIES.map((s) => [s, s] as const)} selected={severities} onToggle={(v) => setSeverities(toggle(severities, v))} />
        {classesPresent.length ? (
          <Facet
            label="Damage"
            options={classesPresent.map((c) => [c, CLASS_LABEL[c] ?? c] as const)}
            selected={classes}
            onToggle={(v) => setClasses(toggle(classes, v))}
          />
        ) : null}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: color.a.ink2, cursor: 'pointer' }}>
          <input type="checkbox" checked={escalatedOnly} onChange={(e) => setEscalatedOnly(e.target.checked)} />
          Forwarded up only
        </label>
      </Sidebar>

      <Main wide>
        <PageHead
          title="Ticket queue"
          sub={`${scopeLabel} · ${shown.length} of ${total} shown`}
          right={
            <>
              {states.length || severities.length || classes.length || escalatedOnly ? (
                <Btn
                  onClick={() => {
                    setStates([]);
                    setSeverities([]);
                    setClasses([]);
                    setEscalatedOnly(false);
                  }}
                >
                  Clear filters
                </Btn>
              ) : null}
              <ExportMenu scopeLabel={scopeLabel} />
            </>
          }
        />
        {!configured ? <NotConfigured /> : null}
        <Panel flush>
          <TicketTable
            rows={shown}
            emptyNote={
              total === 0
                ? 'No tickets in this jurisdiction. Severe damage in an upload opens one immediately; milder damage is stored but does not open a ticket on its own.'
                : 'No tickets match these filters.'
            }
          />
        </Panel>
      </Main>
    </>
  );
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Facet<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>{label}</div>
      {options.map(([value, text]) => (
        <label
          key={value}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12.5, color: color.a.ink2, cursor: 'pointer', textTransform: 'capitalize' }}
        >
          <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />
          {text}
        </label>
      ))}
    </div>
  );
}
