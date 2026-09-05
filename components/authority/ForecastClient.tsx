'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Chip, Inset, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { NotConfigured, TD, TH, TicketTable } from './bits';
import type { DeteriorationData } from '@/lib/authority';
import { color, severityTone } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

export default function ForecastClient({ data, scopeLabel }: { data: DeteriorationData; scopeLabel: string }) {
  const { worsening, repeatSightings, clusters } = data;

  return (
    <>
      <Sidebar>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>Jurisdiction</div>
          <JurisdictionTree />
        </div>
        <Inset>
          <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
            A road gets a severity every time a camera passes it. When a later pass reads worse than an
            earlier one, that is deterioration you can point at. Everything on this page is that
            comparison — no model, no extrapolation.
          </p>
        </Inset>
      </Sidebar>

      <Main wide>
        <PageHead title="Deterioration watch" sub={scopeLabel} />
        {!data.configured ? <NotConfigured /> : null}

        <KpiRow>
          <KpiTile label="Getting worse" value={worsening.length} tone={worsening.length ? 'red' : undefined} sub="severity rose on a later pass" />
          <KpiTile label="Seen more than once" value={repeatSightings.length} sub="confirmed by repeat passes" />
          <KpiTile label="Streets with clusters" value={clusters.length} sub="more than one defect" />
          <KpiTile label="Tickets in scope" value={data.totalTickets} />
          <KpiTile
            label="Confirmed share"
            value={data.totalTickets ? `${Math.round((repeatSightings.length / data.totalTickets) * 100)}%` : '—'}
            sub="backed by more than one pass"
          />
        </KpiRow>

        <Panel flush>
          <PanelHead title="Roads that read worse on a later pass" sub="First severity → latest severity" />
          {worsening.length ? (
            <div style={{ padding: '10px 12px 6px' }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...TH, width: 62 }}>Evidence</th>
                    <th scope="col" style={TH}>Ticket</th>
                    <th scope="col" style={TH}>Where</th>
                    <th scope="col" style={TH}>Change</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Passes</th>
                  </tr>
                </thead>
                <tbody>
                  {worsening.map((w) => (
                    <tr key={w.id}>
                      <td style={TD}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.imageUrl} alt="" style={{ width: 50, height: 33, objectFit: 'cover', borderRadius: 5, border: `1px solid ${color.a.line}` }} />
                      </td>
                      <td style={TD}>
                        <Link href={`/tickets/${w.id}`} className="mono" style={{ color: color.a.ink, textDecoration: 'none' }}>
                          {w.id}
                        </Link>
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize: 12.5 }}>{w.address ?? 'location not resolved'}</div>
                        <div className="tiny" style={{ color: color.a.dim, marginTop: 3 }}>
                          {CLASS_LABEL[w.damageClass] ?? w.damageClass}
                        </div>
                      </td>
                      <td style={TD}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Chip tone={severityTone[w.from]}>{w.from}</Chip>
                          <span style={{ color: color.a.faint }}>→</span>
                          <Chip tone={severityTone[w.to]} dot>{w.to}</Chip>
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <span className="num" style={{ fontSize: 13 }}>{w.passes}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PanelBody>
              <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
                Nothing has read worse on a later pass. This fills in once the same stretch is driven
                twice — a single upload can only say what the road is like today.
              </p>
            </PanelBody>
          )}
        </Panel>

        <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Panel flush style={{ flex: 1, minWidth: 0 }}>
            <PanelHead title="Backed by repeat passes" sub="Most independent sightings first" />
            <TicketTable
              rows={repeatSightings}
              showLevel={false}
              emptyNote="No defect has been seen on more than one pass yet."
            />
          </Panel>

          <Panel className="rs-fixed" style={{ width: 360, flexShrink: 0 }}>
            <PanelHead title="Streets with more than one defect" />
            <PanelBody style={{ paddingTop: 6 }}>
              {clusters.length ? (
                clusters.map((c, i) => (
                  <div
                    key={c.address}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 0',
                      borderBottom: i < clusters.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.address}
                    </span>
                    <span className="num" style={{ fontSize: 14 }}>{c.count}</span>
                    <Chip tone={severityTone[c.worst]}>{c.worst}</Chip>
                  </div>
                ))
              ) : (
                <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
                  No street has more than one reported defect yet.
                </p>
              )}
            </PanelBody>
          </Panel>
        </div>

        <Inset>
          <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: color.a.ink2 }}>Why this is not a forecast.</strong> Predicting when a
            stretch will fail, and what sealing it now would save, needs a condition index tracked over
            months of repeat passes plus real repair costs. Neither exists in this database yet, and a
            projected rupee figure built on a week of data would be a guess wearing a suit.
          </p>
        </Inset>
      </Main>
    </>
  );
}
