'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, KpiRow, KpiTile, Panel, PanelHead } from '@/components/system';
import { LEVEL_LABEL, NotConfigured, TicketTable } from './bits';
import type { TicketRow } from '@/lib/authority';
import { ESCALATION } from '@/lib/sla';
import { color } from '@/lib/tokens';

export default function EscalationsClient({
  escalated,
  breached,
  dueSoon,
  configured,
  scopeLabel,
}: {
  escalated: TicketRow[];
  breached: TicketRow[];
  dueSoon: TicketRow[];
  configured: boolean;
  scopeLabel: string;
}) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function runEscalation() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/maintenance/escalate', { method: 'POST' });
      const body = await res.json();
      setResult(
        body.escalated
          ? `${body.escalated} ticket${body.escalated === 1 ? '' : 's'} moved up a level.`
          : 'Nothing was overdue for escalation.',
      );
      router.refresh();
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Sidebar>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>Jurisdiction</div>
          <JurisdictionTree />
        </div>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>The ladder</div>
          {ESCALATION.map((l, i) => (
            <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0' }}>
              <span className="mono" style={{ color: color.a.faint }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: color.a.ink2 }}>{LEVEL_LABEL[l]}</span>
            </div>
          ))}
          <p className="tiny" style={{ color: color.a.dim, marginTop: 8, lineHeight: 1.55 }}>
            Miss the acknowledge deadline and the ticket climbs one step, and the level it lands on gets
            a fresh window to answer.
          </p>
        </div>
      </Sidebar>

      <Main wide>
        <PageHead
          title="Escalation ladder"
          sub={scopeLabel}
          right={
            <Btn primary onClick={runEscalation} disabled={running}>
              {running ? 'Running…' : 'Run escalation pass'}
            </Btn>
          }
        />
        {!configured ? <NotConfigured /> : null}
        {result ? (
          <div style={{ fontSize: 12.5, color: color.a.muted }}>{result}</div>
        ) : null}

        <KpiRow>
          <KpiTile label="Past fix deadline" value={breached.length} tone={breached.length ? 'red' : undefined} />
          <KpiTile label="In the last quarter of their window" value={dueSoon.length} tone={dueSoon.length ? 'amber' : undefined} />
          <KpiTile label="Escalated" value={escalated.length} tone={escalated.length ? 'amber' : undefined} sub="climbed at least one level" />
          <KpiTile label="At the top" value={escalated.filter((t) => t.level === 'state_department').length} sub="state department" />
          <KpiTile label="Open in scope" value={breached.length + dueSoon.length} sub="needing attention" />
        </KpiRow>

        <Panel flush>
          <PanelHead title="Past their deadline" sub="Longest overdue first" />
          <TicketTable rows={breached} emptyNote="Nothing is past its fix deadline in this jurisdiction." />
        </Panel>

        <Panel flush>
          <PanelHead title="Already escalated" sub="Climbed at least one level" />
          <TicketTable
            rows={escalated}
            emptyNote="Nothing has escalated. A ticket climbs only after its acknowledge deadline passes unanswered."
          />
        </Panel>

        <Panel flush>
          <PanelHead title="Running out of time" sub="Less than a quarter of the fix window left" />
          <TicketTable rows={dueSoon} emptyNote="Nothing is close to its fix deadline." />
        </Panel>
      </Main>
    </>
  );
}
