'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Main } from '@/components/system/Page';
import {
  Bar,
  Btn,
  Chip,
  Inset,
  Panel,
  PanelBody,
  PanelHead,
  SlaPlate,
} from '@/components/system';
import RoadMap from '@/components/data/RoadMap';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import { AUDIT, TICKET } from '@/lib/fixtures/tickets';
import { inr } from '@/lib/fixtures/contractors';
import { color, toneColor } from '@/lib/tokens';

const TONE = { good: 'green', warn: 'amber', bad: 'red' } as const;

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? TICKET.id;
  const t = TICKET;
  const [audit, setAudit] = useState(AUDIT);
  const [state, setState] = useState<string | null>(null);

  const act = (action: string, actor: string, tone: 'good' | 'warn' | 'bad') => {
    setState(action);
    setAudit((a) => [
      ...a,
      {
        id: `a${a.length + 1}`,
        ticketId: id,
        action,
        actor,
        at: '05 Sep, 09:52',
        hash: `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
        prevHash: a[a.length - 1].hash,
        tone,
      },
    ]);
  };

  return (
    <Main wide>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: 12.5, color: color.a.ink }}>
              {id}
            </span>
            <Chip tone="red">Escalated · level 2</Chip>
            <Chip>Reported by {t.passes} vehicles</Chip>
            {state ? <Chip tone="green">{state}</Chip> : null}
          </div>
          <h1 className="h1" style={{ marginTop: 10, color: color.a.ink }}>
            Pothole on G.S. Road, before Ganeshguri flyover
          </h1>
          <p className="sub" style={{ color: color.a.muted, marginTop: 7 }}>
            Arterial road · GMC Zone 3 · chainage {t.chainage} · {t.coordinates.lat}°N{' '}
            {t.coordinates.lng}°E
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SlaPlate value={t.daysOver} unit="days over" tone="red" />
          <Btn>Reassign</Btn>
          <Btn onClick={() => act('Acknowledged', 'R. Bhuyan, Ward Engineer', 'good')}>
            Acknowledge
          </Btn>
          <Btn primary onClick={() => act('Contractor assigned · Luit Roadworks', 'R. Bhuyan, Ward Engineer', 'good')}>
            Assign contractor
          </Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* left */}
        <div style={{ width: 652, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel flush>
            <PanelHead
              title="Evidence from passing vehicles"
              right={
                <span className="tiny" style={{ color: color.a.dim }}>
                  Plates and faces blurred on device
                </span>
              }
            />
            <div style={{ padding: 13 }}>
              <EvidenceFrame
                width={626}
                height={276}
                kind="pothole"
                boxes={[{ label: 'Pothole .94' }]}
                seed={11}
              />
              <div className="tiny" style={{ color: color.a.muted, margin: '8px 0 10px' }}>
                Latest pass · 02 Sep, 08:14 · confidence .94
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {t.evidence.map((e, i) => (
                  <div key={i}>
                    <EvidenceFrame
                      width={148}
                      height={76}
                      kind="pothole"
                      far={i < 2}
                      night={!!e.night}
                      seed={20 + i}
                      radius={8}
                    />
                    <div className="tiny" style={{ color: color.a.dim, marginTop: 6 }}>
                      {e.capturedAt}
                      {e.night ? ' (night)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
            <Panel style={{ flex: 1, minWidth: 0 }}>
              <PanelHead title="Why this is priority 1" right={<Chip tone="red">Severity 0.91</Chip>} />
              <PanelBody style={{ paddingTop: 8 }}>
                {t.severityFactors.map((f) => {
                  const tone = f.value >= 0.85 ? 'red' : 'amber';
                  return (
                    <div key={f.label} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 12.5, color: color.a.ink2 }}>{f.label}</span>
                        <span className="mono" style={{ color: toneColor(tone, 'dark') }}>
                          {f.value.toFixed(2)}
                        </span>
                      </div>
                      <Bar value={f.value * 100} tone={tone} />
                    </div>
                  );
                })}
              </PanelBody>
            </Panel>

            <Panel flush style={{ width: 268, flexShrink: 0 }}>
              <PanelHead title="Location" />
              <RoadMap
                width={266}
                height={196}
                theme="dark"
                labels={false}
                seed={9}
                points={[{ x: 0.5, y: 0.5, sev: 'critical', ring: true }]}
                focus={[0.5, 0.5, 34]}
              />
              <div className="tiny" style={{ color: color.a.muted, padding: '11px 13px', lineHeight: 1.5 }}>
                Owned by GMC Zone 3. Bhangagarh hospital gate is 180 m away.
              </div>
            </Panel>
          </div>
        </div>

        {/* right */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel>
            <PanelHead title="Audit trail" right={<Chip tone="blue">Hash chained</Chip>} />
            <PanelBody style={{ padding: '2px 14px 6px' }}>
              {audit.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'center',
                    padding: '5px 0',
                    borderBottom: i < audit.length - 1 ? `1px solid ${color.a.lineSoft}` : undefined,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: toneColor(TONE[a.tone], 'dark'),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13,
                        color: color.a.ink,
                        letterSpacing: '-0.011em',
                        lineHeight: 1.25,
                      }}
                    >
                      {a.action}
                    </span>
                    <span className="tiny" style={{ color: color.a.muted, display: 'block', lineHeight: 1.3 }}>
                      {a.actor} · {a.at}
                    </span>
                  </span>
                  <span className="mono" style={{ color: color.blueLift }}>
                    {a.hash}
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Repair estimate" right={<Chip>Rate card 2026-27</Chip>} />
            <PanelBody style={{ padding: '12px 14px' }}>
              <div className="num" style={{ fontSize: 30, color: color.a.ink }}>
                ₹ {inr(t.estimate!.total)}
              </div>
              <div className="tiny" style={{ color: color.a.muted, marginTop: 6 }}>
                {t.estimate!.areaM2} m² × ₹{inr(t.estimate!.ratePerM2)} per m², bituminous patch
              </div>
              <div style={{ marginTop: 10 }}>
                {[
                  ['Suggested contractor', 'Luit Roadworks', color.a.ink],
                  ['Reliability', '0.86 · 1 reopened in 24', color.greenLift],
                  ['Warranty if repaired now', `till ${t.estimate!.warrantyUntil}`, color.a.ink],
                ].map(([k, v, c]) => (
                  <div
                    key={k as string}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderTop: `1px solid ${color.a.lineSoft}`,
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: color.a.muted }}>{k}</span>
                    <span style={{ fontSize: 12.5, color: c as string }}>{v}</span>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Who this affects" />
            <PanelBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Inset>
                  <div className="num" style={{ fontSize: 22, color: color.a.ink }}>
                    {t.vehiclesPerDay.toLocaleString('en-IN')}
                  </div>
                  <div className="tiny" style={{ color: color.a.muted, marginTop: 5 }}>
                    vehicles a day over this spot
                  </div>
                </Inset>
                <Inset>
                  <div className="num" style={{ fontSize: 22, color: color.a.ink }}>
                    {t.followers}
                  </div>
                  <div className="tiny" style={{ color: color.a.muted, marginTop: 5 }}>
                    citizens following this ticket
                  </div>
                </Inset>
                <Inset>
                  <div className="num" style={{ fontSize: 22, color: color.redLift }}>
                    {t.nearbyOpen}
                  </div>
                  <div className="tiny" style={{ color: color.a.muted, marginTop: 5 }}>
                    other open tickets within 500 m
                  </div>
                </Inset>
              </div>
              <p className="sub" style={{ color: color.a.muted, marginTop: 11 }}>
                Ambulances reaching Bhangagarh hospital use this lane. Severity was raised one level
                for proximity to a hospital gate.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </Main>
  );
}
