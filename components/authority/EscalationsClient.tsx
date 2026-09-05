'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { LEVEL_LABEL, NotConfigured, TicketTable } from './bits';
import type { AuthorityNode, TicketRow } from '@/lib/authority';
import { ESCALATION } from '@/lib/ladder';
import { color } from '@/lib/tokens';

export default function EscalationsClient({
  escalated,
  waiting,
  authorities,
  configured,
  scopeLabel,
}: {
  escalated: TicketRow[];
  waiting: TicketRow[];
  authorities: AuthorityNode[];
  configured: boolean;
  scopeLabel: string;
}) {
  const router = useRouter();
  // Signed, not anonymous: forwarding a ticket is a named act in the audit chain.
  const [actor, setActor] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Where each row goes, chosen per ticket. Unset means the office registered
  // above its current owner, which is what the row's dropdown starts on.
  const [targets, setTargets] = React.useState<Record<string, string>>({});

  const byId = new Map(authorities.map((a) => [a.id, a]));
  const parentOf = (row: TicketRow) =>
    (row.authorityId ? byId.get(row.authorityId)?.parentId : null) ?? '';
  const targetFor = (row: TicketRow) => targets[row.id] ?? parentOf(row);

  async function forward(row: TicketRow) {
    if (!actor.trim()) {
      setError('Say who you are first — every forward is signed into the ticket’s history.');
      return;
    }
    const toAuthorityId = targetFor(row);
    if (!toAuthorityId) {
      setError(`Choose which office ${row.id} goes to — nothing is registered above its current owner.`);
      return;
    }
    setBusy(row.id);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tickets/${row.id}/forward`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: actor.trim(), toAuthorityId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `failed (${res.status})`);
      setResult(`${row.id} is now with ${byId.get(body.authorityId)?.name ?? body.level}.`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /** Who holds it now, where it goes next, and the button that moves it. */
  function ForwardControl(row: TicketRow) {
    const options = authorities.filter((a) => a.id !== row.authorityId);
    if (!options.length) {
      return <span className="tiny" style={{ color: color.a.dim }}>no other office</span>;
    }
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
        <select
          value={targetFor(row)}
          onChange={(e) => setTargets({ ...targets, [row.id]: e.target.value })}
          aria-label={`Office to forward ${row.id} to`}
          style={{
            height: 28,
            maxWidth: 190,
            borderRadius: 7,
            border: `1px solid ${color.a.border}`,
            background: color.a.control,
            color: color.a.ink,
            padding: '0 6px',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        >
          <option value="">Choose an office…</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <Btn small onClick={() => forward(row)} disabled={busy !== null}>
          {busy === row.id ? 'Sending…' : 'Send'}
        </Btn>
      </span>
    );
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
            A ticket reaches its office the moment it is opened. It moves on only when somebody
            forwards it, to an office they pick, and the history records who did.
          </p>
        </div>
      </Sidebar>

      <Main wide>
        <PageHead title="Escalation ladder" sub={scopeLabel} />
        {!configured ? <NotConfigured /> : null}

        <Panel>
          <PanelHead title="Acting as" sub="Needed before anything can be forwarded" />
          <PanelBody>
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="name or staff id"
              style={{
                width: 260,
                maxWidth: '100%',
                height: 34,
                borderRadius: 8,
                border: `1px solid ${color.a.border}`,
                background: color.a.control,
                color: color.a.ink,
                padding: '0 9px',
                fontSize: 12.5,
                fontFamily: 'inherit',
              }}
            />
            {result ? (
              <div className="tiny" style={{ color: color.a.ink2, marginTop: 9 }}>{result}</div>
            ) : null}
            {error ? (
              <div className="tiny" style={{ color: color.redLift, marginTop: 9 }}>{error}</div>
            ) : null}
          </PanelBody>
        </Panel>

        <KpiRow>
          <KpiTile label="Open in scope" value={escalated.length + waiting.length} sub="not yet repaired" />
          <KpiTile
            label="Forwarded up"
            value={escalated.length}
            tone={escalated.length ? 'red' : undefined}
            sub="climbed at least one level"
          />
          <KpiTile
            label="At the top"
            value={escalated.filter((t) => t.level === 'state_department').length}
            sub="state department"
          />
          <KpiTile label="With their first office" value={waiting.length} sub="never forwarded" />
        </KpiRow>

        <Panel flush>
          <PanelHead title="Already forwarded" sub="Climbed at least one level" />
          <TicketTable
            rows={escalated}
            action={ForwardControl}
            actionLabel="Send on to"
            emptyNote="Nothing has been forwarded. A ticket climbs only when somebody sends it up."
          />
        </Panel>

        <Panel flush>
          <PanelHead title="Still with their first office" sub="Longest open first" />
          <TicketTable
            rows={waiting}
            action={ForwardControl}
            actionLabel="Forward to"
            emptyNote="Nothing open is sitting with its original office."
          />
        </Panel>
      </Main>
    </>
  );
}
