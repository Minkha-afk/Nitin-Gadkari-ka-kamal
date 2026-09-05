'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, Chip, Inset, Panel, PanelBody, PanelHead, SlaPlate } from '@/components/system';
import { LEVEL_LABEL, STATE_LABEL, STATE_TONE, slaTone } from './bits';
import type { TicketDetail } from '@/lib/authority';
import type { TicketAction } from '@/lib/tickets';
import { color, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

const ACTION_LABEL: Record<TicketAction, string> = {
  acknowledge: 'Acknowledge',
  assign: 'Assign to contractor',
  'mark-repaired': 'Mark repaired',
  verify: 'Verify fixed',
  close: 'Close',
  reopen: 'Reopen',
};

export default function TicketDetailClient({
  detail,
  actions,
}: {
  detail: TicketDetail;
  actions: TicketAction[];
}) {
  const router = useRouter();
  const { ticket, events, evidence, chain, authority, contractor, contractorOptions } = detail;

  const [actor, setActor] = React.useState('');
  const [note, setNote] = React.useState('');
  const [contractorId, setContractorId] = React.useState(contractorOptions[0]?._id ?? '');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(action: TicketAction) {
    if (!actor.trim()) {
      setError('Say who is doing this — every change is signed into the audit trail.');
      return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/transition`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          actor: actor.trim(),
          note: note.trim() || null,
          ...(action === 'assign' ? { contractorId } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `failed (${res.status})`);
      setNote('');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Main wide>
      <PageHead
        title={ticket.id}
        sub={
          <>
            {CLASS_LABEL[ticket.damageClass] ?? ticket.damageClass} · {ticket.address ?? 'location not resolved'}
          </>
        }
        right={
          <>
            <Chip tone={severityTone[ticket.severity]} dot>
              {ticket.severityLabel}
            </Chip>
            <Chip tone={STATE_TONE[ticket.state]}>{STATE_LABEL[ticket.state]}</Chip>
            <SlaPlate
              value={ticket.dueLabel.split(' ').slice(0, -1).join(' ')}
              unit={ticket.dueLabel.split(' ').slice(-1)[0] === 'left' ? 'left' : 'over'}
              tone={slaTone(ticket)}
            />
          </>
        }
      />

      <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel flush>
            <PanelHead
              title="Evidence"
              sub={`${evidence.length} detection${evidence.length === 1 ? '' : 's'} · ${ticket.passes} independent pass${ticket.passes === 1 ? '' : 'es'}`}
            />
            <PanelBody style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {evidence.map((e) => (
                <div key={e.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.imageUrl}
                    alt=""
                    style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: 8, border: `1px solid ${color.a.line}`, background: color.a.inset }}
                  />
                  <div className="tiny" style={{ color: color.a.muted, marginTop: 6 }}>
                    {(e.confidence * 100).toFixed(0)}% · {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {!evidence.length ? (
                <p className="tiny" style={{ color: color.a.dim }}>The defect documents behind this ticket are gone.</p>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel flush>
            <PanelHead
              title="History"
              sub="Append-only. Every row carries the hash of the one before it."
              right={
                <Chip tone={chain.intact ? 'green' : 'red'} dot>
                  {chain.intact ? `${chain.events} events, chain intact` : `broken at event ${chain.brokenAtSeq}`}
                </Chip>
              }
            />
            <PanelBody style={{ paddingTop: 6 }}>
              {events.map((e, i) => (
                <div
                  key={e._id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < events.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                  }}
                >
                  <span className="mono" style={{ color: color.a.faint, width: 20, flexShrink: 0 }}>{e.seq}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: toneColor(e.tone === 'good' ? 'green' : e.tone === 'bad' ? 'red' : 'amber', 'dark') }}>
                      {e.action}
                    </span>
                    {e.note ? (
                      <span className="tiny" style={{ color: color.a.ink2, display: 'block', marginTop: 3 }}>{e.note}</span>
                    ) : null}
                    <span className="mono" style={{ color: color.a.dim, display: 'block', marginTop: 3 }}>
                      {e.actor} · {new Date(e.at).toLocaleString()}
                    </span>
                  </span>
                  <span className="mono" style={{ color: color.a.faint, flexShrink: 0 }} title={e.hash}>
                    {e.hash.slice(0, 10)}…
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>

        <div className="rs-fixed" style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel>
            <PanelHead title="Move it along" />
            <PanelBody>
              <label style={{ display: 'block' }}>
                <span className="lbl" style={{ color: color.a.muted }}>Who are you?</span>
                <input
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="name or staff id"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'block', marginTop: 10 }}>
                <span className="lbl" style={{ color: color.a.muted }}>Note (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="what changed and why"
                  style={inputStyle}
                />
              </label>

              {actions.includes('assign') ? (
                <label style={{ display: 'block', marginTop: 10 }}>
                  <span className="lbl" style={{ color: color.a.muted }}>Contractor</span>
                  {contractorOptions.length ? (
                    <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} style={inputStyle}>
                      {contractorOptions.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="tiny" style={{ color: color.a.dim, display: 'block', marginTop: 5, lineHeight: 1.5 }}>
                      No contractors registered. Add one on the{' '}
                      <Link href="/contractors" style={{ color: color.blueLift }}>Contractors</Link> page before assigning.
                    </span>
                  )}
                </label>
              ) : null}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {actions.map((a) => (
                  <Btn
                    key={a}
                    primary={a !== 'reopen'}
                    small
                    onClick={() => run(a)}
                    disabled={busy !== null || (a === 'assign' && !contractorOptions.length)}
                  >
                    {busy === a ? 'Working…' : ACTION_LABEL[a]}
                  </Btn>
                ))}
              </div>

              {error ? (
                <div className="tiny" style={{ color: color.redLift, marginTop: 10, lineHeight: 1.5 }}>{error}</div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Who owns it" />
            <PanelBody>
              <Row label="Authority" value={authority?.name ?? 'Unassigned — no jurisdiction covers this point'} />
              <Row label="Sitting with" value={LEVEL_LABEL[ticket.level] ?? ticket.level} />
              <Row label="Escalated" value={ticket.escalationCount ? `${ticket.escalationCount}×` : 'never'} />
              <Row label="Contractor" value={contractor?.name ?? 'none assigned'} />
              <Row label="Acknowledge by" value={new Date(ticket.slaAckDue).toLocaleString()} />
              <Row label="Fix by" value={new Date(ticket.slaFixDue).toLocaleString()} />
              <Row label="Opened" value={new Date(ticket.createdAt).toLocaleString()} />
              {ticket.lat != null && ticket.lng != null ? (
                <Row label="Where" value={`${ticket.lat.toFixed(5)}, ${ticket.lng.toFixed(5)}`} />
              ) : null}
            </PanelBody>
          </Panel>

          <Inset>
            <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
              Severity is the detector&rsquo;s reading of visible surface damage, not an official safety
              determination. The ticket is the record of what was done about it.
            </p>
          </Inset>
        </div>
      </div>
    </Main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  marginTop: 5,
  borderRadius: 8,
  border: `1px solid ${color.a.border}`,
  background: color.a.control,
  color: color.a.ink,
  padding: '0 9px',
  fontSize: 12.5,
  fontFamily: 'inherit',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${color.a.lineSoft}` }}>
      <span className="tiny" style={{ color: color.a.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, textAlign: 'right', color: color.a.ink }}>{value}</span>
    </div>
  );
}
