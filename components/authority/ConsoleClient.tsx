'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Bar, Chip, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { NotConfigured, STATE_LABEL, STATE_TONE, SlaCell } from './bits';
import type { ConsoleData } from '@/lib/authority';
import { color, severityColor, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

const TripMap = dynamic(() => import('@/components/data/TripMap'), {
  ssr: false,
  loading: () => <div style={{ height: 380, background: color.a.inset }} />,
});

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 172_800) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86_400)} d ago`;
}

export default function ConsoleClient({ data }: { data: ConsoleData }) {
  const { kpis, byState, bySeverity, needsYou, mapPoints, incoming } = data;
  const nothing = kpis.open === 0 && kpis.closed === 0;

  return (
    <>
      <Sidebar>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>
            Jurisdiction
          </div>
          <JurisdictionTree />
        </div>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>
            Open by severity
          </div>
          {bySeverity.length ? (
            bySeverity.map((s) => (
              <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span style={{ flex: 1, fontSize: 12, textTransform: 'capitalize', color: color.a.ink2 }}>
                  {s.severity}
                </span>
                <Bar value={(s.count / Math.max(1, kpis.open)) * 100} width={64} color={severityColor(s.severity, 'dark')} />
                <span className="mono" style={{ color: color.a.ink }}>{s.count}</span>
              </div>
            ))
          ) : (
            <p className="tiny" style={{ color: color.a.dim, margin: 0 }}>Nothing open.</p>
          )}
        </div>
      </Sidebar>

      <Main wide>
        <PageHead
          title="Command centre"
          sub={`${data.scopeLabel} · ${data.totalDefects} defect${data.totalDefects === 1 ? '' : 's'} reported in total`}
        />

        {!data.configured ? <NotConfigured /> : null}

        <KpiRow>
          <KpiTile label="Open" value={kpis.open} sub="not yet repaired" />
          <KpiTile label="Past deadline" value={kpis.breached} tone={kpis.breached ? 'red' : undefined} sub="SLA breached" />
          <KpiTile label="Awaiting verification" value={kpis.awaitingVerification} tone={kpis.awaitingVerification ? 'amber' : undefined} sub="contractor says done" />
          <KpiTile label="Settled" value={kpis.closed} tone={kpis.closed ? 'green' : undefined} sub="verified or closed" />
          <KpiTile label="Unowned" value={kpis.unowned} tone={kpis.unowned ? 'amber' : undefined} sub="no jurisdiction covers them" />
        </KpiRow>

        <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          <Panel flush style={{ flex: 1, minWidth: 0 }}>
            <PanelHead
              title="Open tickets on the map"
              sub={mapPoints.length ? `${mapPoints.length} with coordinates` : undefined}
            />
            {mapPoints.length ? (
              <TripMap
                route={[]}
                hazards={mapPoints
                  .filter((t) => t.lat != null && t.lng != null)
                  .map((t) => ({
                    id: t.id,
                    damageClass: t.damageClass,
                    severity: t.severity,
                    severityLabel: t.severityLabel,
                    lat: t.lat!,
                    lng: t.lng!,
                    address: t.address,
                    imageUrl: t.imageUrl,
                  }))}
                height={380}
              />
            ) : (
              <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.a.dim, fontSize: 13, padding: 24, textAlign: 'center' }}>
                {nothing
                  ? 'No tickets yet. Severe damage in an upload opens one automatically.'
                  : 'Open tickets exist but none carry coordinates, so none can be placed.'}
              </div>
            )}
          </Panel>

          <Panel className="rs-fixed" style={{ width: 372, flexShrink: 0 }}>
            <PanelHead title="Needs you first" sub="Soonest deadline, over-deadline first" />
            <PanelBody style={{ paddingTop: 4 }}>
              {needsYou.length ? (
                needsYou.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '10px 0',
                      borderBottom: i < needsYou.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ width: 62, flexShrink: 0 }}>
                      <SlaCell row={t} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.address ?? t.id}
                      </span>
                      <span className="tiny" style={{ color: color.a.dim }}>
                        {CLASS_LABEL[t.damageClass] ?? t.damageClass} · {t.passes} pass{t.passes === 1 ? '' : 'es'}
                      </span>
                    </span>
                    <Chip tone={severityTone[t.severity]}>{t.severityLabel}</Chip>
                  </Link>
                ))
              ) : (
                <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
                  Nothing open in this jurisdiction.
                </p>
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          <Panel className="rs-fixed" style={{ width: 372, flexShrink: 0 }}>
            <PanelHead title="Where the work is sitting" />
            <PanelBody>
              {byState.length ? (
                byState.map((s) => (
                  <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                    <span style={{ width: 104, fontSize: 12.5, color: color.a.ink2 }}>{STATE_LABEL[s.state]}</span>
                    <Bar
                      value={(s.count / Math.max(1, byState.reduce((n, x) => n + x.count, 0))) * 100}
                      color={toneColor(STATE_TONE[s.state], 'dark')}
                      style={{ flex: 1 }}
                    />
                    <span className="num" style={{ fontSize: 14, width: 26, textAlign: 'right' }}>{s.count}</span>
                  </div>
                ))
              ) : (
                <p className="tiny" style={{ color: color.a.dim }}>No tickets in this jurisdiction yet.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel flush style={{ flex: 1, minWidth: 0 }}>
            <PanelHead title="Coming in" sub="Newest detections across every jurisdiction" />
            <PanelBody style={{ paddingTop: 4 }}>
              {incoming.length ? (
                incoming.map((d, i) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '9px 0',
                      borderBottom: i < incoming.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                    }}
                  >
                    <span className="mono" style={{ color: color.a.dim, width: 68, flexShrink: 0 }}>
                      {ago(d.createdAt)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.address ?? 'no address'}
                    </span>
                    <span className="tiny" style={{ color: color.a.muted }}>
                      {CLASS_LABEL[d.damageClass] ?? d.damageClass}
                    </span>
                    <span className="mono" style={{ color: color.a.dim, width: 34, textAlign: 'right' }}>
                      {d.confidence.toFixed(2)}
                    </span>
                    {d.ticketId ? (
                      <Link href={`/tickets/${d.ticketId}`} className="mono" style={{ color: color.blueLift, textDecoration: 'none' }}>
                        {d.ticketId}
                      </Link>
                    ) : (
                      <span className="tiny" style={{ color: color.a.faint }}>no ticket</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
                  Nothing has been uploaded yet.
                </p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </Main>
    </>
  );
}
