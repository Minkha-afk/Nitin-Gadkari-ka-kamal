'use client';

import React from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import { Bar, Btn, Chip, Dot, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import { CLASS_ACCURACY, SOURCES, UNSURE, VERSIONS } from '@/lib/fixtures/model';
import { color, toneColor, type Tone } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 10px',
  borderBottom: `1px solid ${color.a.line}`,
};
const TD: React.CSSProperties = {
  padding: '11px 10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink2,
};

export default function ModelPage() {
  const send = useFilterState(['conf', 'disagree', 'once', 'wrong']);
  const weak = useFilterState(['night', 'shadow', 'manhole']);

  return (
    <>
      <Sidebar>
        <SidePanel title="Labelling queue">
          <div className="num" style={{ fontSize: 30, color: color.amber }}>
            318
          </div>
          <div className="tiny" style={{ color: color.a.muted, marginTop: 5 }}>
            frames waiting for a human decision
          </div>
          <Bar value={38} tone="amber" style={{ marginTop: 11 }} />
          <div className="tiny" style={{ color: color.a.dim, marginTop: 8 }}>
            121 labelled this week by 3 reviewers
          </div>
        </SidePanel>
        <FilterGroup
          title="Send to review when"
          checked={send.checked}
          onToggle={send.toggle}
          items={[
            { id: 'conf', label: 'Confidence between .30 and .60', count: 218 },
            { id: 'disagree', label: 'Vehicles disagreed on a spot', count: 64 },
            { id: 'once', label: 'Detected once, never again', count: 36 },
            { id: 'wrong', label: 'Reported wrong by an engineer', count: 12 },
          ]}
        />
        <FilterGroup
          title="Known weak spots"
          checked={weak.checked}
          onToggle={weak.toggle}
          items={[
            { id: 'night', label: 'Night and rain frames', count: 94 },
            { id: 'shadow', label: 'Shadows under trees', count: 58 },
            { id: 'manhole', label: 'Manhole covers and tar seams', count: 47 },
            { id: 'patch', label: 'Fresh patches', count: 29 },
          ]}
        />
      </Sidebar>

      <Main>
        <PageHead
          title="Detection quality"
          sub="The model favours precision. The crowd supplies recall, so a missed pothole is found on the next pass."
          right={
            <>
              <Btn>Compare versions</Btn>
              <Btn primary>Promote v8</Btn>
            </>
          }
        />

        <KpiRow>
          <KpiTile label="Precision in the field" value="0.91" tone="green" sub="confirmed by engineers" />
          <KpiTile label="False tickets raised" value="1.4%" tone="green" sub="of all tickets this month" />
          <KpiTile label="Detections per day" value="14,200" sub="from 1,842 vehicles" />
          <KpiTile label="On-device speed" value="22 ms" tone="blue" sub="per frame, mid-range Android" />
          <KpiTile label="Waiting for labels" value="318" tone="amber" sub="low confidence frames" />
        </KpiRow>

        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          <Panel style={{ flex: 1, minWidth: 0 }}>
            <PanelHead
              title="Frames the model was unsure about"
              right={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Chip tone="brand">Confidence .30 to .60</Chip>
                  <Btn small>Open labelling tool</Btn>
                </span>
              }
            />
            <PanelBody>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {UNSURE.map((u, i) => (
                  <div key={u.caption} style={{ width: 190 }}>
                    <div style={{ position: 'relative' }}>
                      <EvidenceFrame
                        width={190}
                        height={96}
                        kind={u.kind}
                        night={u.night}
                        far
                        seed={60 + i}
                        radius={8}
                      />
                      <span
                        className="mono"
                        style={{
                          position: 'absolute',
                          top: 7,
                          left: 7,
                          background: 'rgba(0,0,0,.62)',
                          color: color.mark,
                          padding: '2px 6px',
                          borderRadius: 6,
                        }}
                      >
                        {u.conf}
                      </span>
                    </div>
                    <div className="tiny" style={{ color: color.a.muted, marginTop: 6 }}>
                      {u.caption}
                    </div>
                  </div>
                ))}
              </div>
              <p className="tiny" style={{ color: color.a.dim, marginTop: 13 }}>
                Every decision here goes into the weekly retrain. A version is only promoted if
                accuracy does not drop on the fixed test set.
              </p>
            </PanelBody>
          </Panel>

          <div style={{ width: 352, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Panel>
              <PanelHead title="Accuracy by damage class" sub="v7, test set" />
              <PanelBody style={{ paddingTop: 8 }}>
                {CLASS_ACCURACY.map((c) => (
                  <div key={c.label} style={{ marginBottom: 11 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: color.a.ink2 }}>{c.label}</span>
                      <span className="mono" style={{ color: toneColor(c.tone, 'dark') }}>
                        {c.value.toFixed(2)}
                      </span>
                    </div>
                    <Bar value={c.value * 100} tone={c.tone} />
                  </div>
                ))}
              </PanelBody>
            </Panel>

            <Panel style={{ flex: 1 }}>
              <PanelHead title="Where detections come from" />
              <PanelBody style={{ paddingTop: 8 }}>
                {SOURCES.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '12px 0',
                      borderBottom: `1px solid ${color.a.lineSoft}`,
                    }}
                  >
                    <Dot tone={s.tone as Tone} size={7} />
                    <span style={{ flex: 1, fontSize: 12.5, color: color.a.ink2 }}>{s.label}</span>
                    <span className="num" style={{ fontSize: 15, color: color.a.ink }}>
                      {s.value}%
                    </span>
                  </div>
                ))}
              </PanelBody>
            </Panel>
          </div>
        </div>

        <Panel flush>
          <PanelHead title="Model versions" right={<Chip tone="blue">Retrains every Sunday</Chip>} />
          <div style={{ padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Version</th>
                  <th scope="col" style={TH}>Trained</th>
                  <th scope="col" style={TH}>Data</th>
                  <th scope="col" style={TH}>mAP@0.5</th>
                  <th scope="col" style={TH}>Precision</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {VERSIONS.map((v) => (
                  <tr key={v.version}>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.ink }}>
                        {v.version}
                      </span>
                    </td>
                    <td style={TD}>{v.trainedAt}</td>
                    <td style={TD}>{v.dataset}</td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.mark }}>
                        {v.map50.toFixed(2)}
                      </span>
                    </td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.greenLift }}>
                        {v.precision.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <Chip tone={v.tone as Tone}>{v.state}</Chip>
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
