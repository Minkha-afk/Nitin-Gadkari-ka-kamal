'use client';

import React from 'react';
import Link from 'next/link';
import { Bar, Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import type { MyDefect, MyReports, MyTicket } from '@/lib/reports';
import { color, severityColor, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL, type TicketState } from '@/lib/types';

const STATE_TONE: Record<TicketState, 'red' | 'amber' | 'blue' | 'green' | 'neutral' | 'brand'> = {
  new: 'brand',
  acknowledged: 'blue',
  assigned: 'blue',
  repaired: 'amber',
  verified: 'green',
  closed: 'green',
  reopened: 'red',
};

const STATE_LABEL: Record<TicketState, string> = {
  new: 'Waiting to be seen',
  acknowledged: 'Acknowledged',
  assigned: 'Contractor assigned',
  repaired: 'Repaired, not verified',
  verified: 'Verified fixed',
  closed: 'Closed',
  reopened: 'Damage came back',
};

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

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function ReportsClient({ data }: { data: MyReports }) {
  const { totals, tickets, defects, following } = data;
  const nothing = totals.defects === 0 && totals.uploads === 0;

  return (
    <div
      className="scrollarea rs-row"
      style={{ padding: '20px 28px', display: 'flex', gap: 18, flex: 1, alignItems: 'flex-start' }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h1 className="h1">Your reports</h1>
            <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
              {nothing
                ? 'Nothing sent in from this browser yet.'
                : `${totals.defects} defect${totals.defects === 1 ? '' : 's'} from ${totals.uploads} upload${
                    totals.uploads === 1 ? '' : 's'
                  }, ${totals.tickets} of them raised as tickets.`}
            </p>
          </div>
          <Link href="/upload">
            <Btn primary>Send in a road</Btn>
          </Link>
        </div>

        {!data.configured ? (
          <Panel style={{ padding: '12px 15px', borderColor: '#FAE7C6', background: '#FFFCF5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B45E09' }}>No road database connected</div>
            <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
              Set MONGODB_URI in .env.local.
            </div>
          </Panel>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            [String(totals.defects), 'defects sent', undefined],
            [String(totals.tickets), 'became tickets', undefined],
            [String(totals.fixed), 'marked fixed', totals.fixed ? color.green : undefined],
            [String(totals.breached), 'past deadline', totals.breached ? color.red : undefined],
            [data.medianFixDays != null ? `${data.medianFixDays} d` : '—', 'median time to fix', undefined],
          ].map(([v, l, c]) => (
            <Panel key={l as string} style={{ padding: '12px 14px' }}>
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
          <PanelHead
            title="Tickets raised from your reports"
            sub={
              tickets.length
                ? 'Severe damage opens a ticket automatically. Milder damage is stored but not escalated.'
                : undefined
            }
          />
          {tickets.length ? (
            <div style={{ padding: '12px 12px 6px' }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...TH, width: 64 }}>Evidence</th>
                    <th scope="col" style={TH}>Ticket</th>
                    <th scope="col" style={TH}>Where</th>
                    <th scope="col" style={TH}>Status</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <TicketRow key={t.id} t={t} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PanelBody>
              <p className="sub" style={{ color: color.c.muted, lineHeight: 1.6 }}>
                {nothing
                  ? 'Upload a road and anything severe found in it opens a ticket here, with a deadline the authority is held to.'
                  : 'Nothing you have sent in was severe enough to open a ticket automatically. Only high and critical damage escalates on its own.'}
              </p>
            </PanelBody>
          )}
        </Panel>

        {following.length ? (
          <Panel flush>
            <PanelHead title="Tickets you follow" sub="Raised by someone else" />
            <div style={{ padding: '12px 12px 6px' }}>
              <table>
                <tbody>
                  {following.map((t) => (
                    <TicketRow key={t.id} t={t} />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
      </div>

      {/* right */}
      <div
        className="rs-fixed"
        style={{ width: 352, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <Panel>
          <PanelHead title="Evidence vault" sub="Timestamped, geotagged, kept" />
          <PanelBody style={{ paddingTop: 8 }}>
            {defects.length ? (
              defects.slice(0, 6).map((d, i) => <VaultRow key={d.id} d={d} last={i === Math.min(5, defects.length - 1)} />)
            ) : (
              <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.6 }}>
                Nothing stored from this browser yet. Every defect found in something you upload is kept
                here with the frame it was found in and, where the footage carries it, the coordinates.
              </p>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="What you found, by type" />
          <PanelBody>
            {data.byClass.length ? (
              data.byClass.map((c) => (
                <div key={c.damageClass} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                  <span style={{ flex: 1, fontSize: 12.5 }}>{CLASS_LABEL[c.damageClass] ?? c.damageClass}</span>
                  <Bar value={(c.count / totals.defects) * 100} width={110} color={color.c.ink} />
                  <span className="num" style={{ fontSize: 14, width: 26, textAlign: 'right' }}>
                    {c.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="tiny" style={{ color: color.c.muted }}>Nothing classified yet.</p>
            )}

            {data.bySeverity.length ? (
              <div style={{ marginTop: 12, borderTop: `1px solid ${color.c.lineSoft}`, paddingTop: 10 }}>
                {data.bySeverity.map((s) => (
                  <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                    <span style={{ flex: 1, fontSize: 12.5, textTransform: 'capitalize' }}>{s.severity}</span>
                    <Bar
                      value={(s.count / totals.defects) * 100}
                      width={110}
                      color={severityColor(s.severity, 'light')}
                    />
                    <span className="num" style={{ fontSize: 14, width: 26, textAlign: 'right' }}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Whose reports are these?" />
          <PanelBody>
            <Inset>
              <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.6 }}>
                This page is scoped to <strong>this browser</strong>, not to an account — there are no
                logins yet. Uploads from another browser or after clearing cookies start a separate
                history, and there is no way to merge them.
              </p>
            </Inset>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function TicketRow({ t }: { t: MyTicket }) {
  const tone = t.urgency === 'breached' ? 'red' : t.urgency === 'soon' ? 'amber' : 'neutral';
  return (
    <tr>
      <td style={TD}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.imageUrl}
          alt=""
          style={{ width: 52, height: 34, objectFit: 'cover', borderRadius: 6, border: `1px solid ${color.c.line}` }}
        />
      </td>
      <td style={TD}>
        <span className="mono">{t.id}</span>
      </td>
      <td style={TD}>
        <div style={{ fontWeight: 500 }}>{t.address ?? 'location not resolved'}</div>
        <div className="tiny" style={{ color: color.c.muted, marginTop: 3 }}>
          {CLASS_LABEL[t.damageClass] ?? t.damageClass} · {t.severityLabel} · first sent {when(t.createdAt)}
          {t.passes > 1 ? ` · ${t.passes} sightings` : ''}
        </div>
      </td>
      <td style={TD}>
        <Chip tone={STATE_TONE[t.state]}>{STATE_LABEL[t.state]}</Chip>
      </td>
      <td style={{ ...TD, textAlign: 'right', color: toneColor(tone, 'light') }}>{t.dueLabel}</td>
    </tr>
  );
}

function VaultRow({ d, last }: { d: MyDefect; last: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: last ? undefined : '1px solid #F5F5F5',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={d.imageUrl}
        alt=""
        style={{ width: 64, height: 42, objectFit: 'cover', borderRadius: 7, border: `1px solid ${color.c.line}` }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, letterSpacing: '-0.011em' }}>
          {CLASS_LABEL[d.damageClass] ?? d.damageClass}
          {d.address ? ` · ${d.address}` : ''}
        </span>
        <span className="mono" style={{ color: color.c.muted, display: 'block', marginTop: 4 }}>
          {new Date(d.createdAt).toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className="mono" style={{ color: color.c.dim, display: 'block', marginTop: 2 }}>
          {d.lat != null && d.lng != null ? `${d.lat.toFixed(4)}°N ${d.lng.toFixed(4)}°E` : 'no coordinates'}
        </span>
      </span>
      <Chip tone={severityTone[d.severity]}>{d.severityLabel}</Chip>
    </div>
  );
}
