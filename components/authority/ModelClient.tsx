'use client';

import React from 'react';
import { Main, PageHead } from '@/components/system/Page';
import { Bar, Chip, Inset, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { NotConfigured, TD, TH } from './bits';
import type { ModelStats } from '@/lib/authority';
import { color } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

interface Health {
  status?: string;
  weights?: string;
  weights_kind?: string;
  pothole_model?: string;
  pothole_model_kind?: string;
  mode?: string;
  cuda?: boolean;
  gpu?: string;
}

export default function ModelClient({ stats }: { stats: ModelStats }) {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [down, setDown] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    fetch('/api/ml/health')
      .then((r) => r.json())
      .then((h) => live && setHealth(h))
      .catch(() => live && setDown(true));
    return () => {
      live = false;
    };
  }, []);

  const maxBand = Math.max(1, ...stats.confidenceBands.map((b) => b.count));

  return (
    <Main wide>
      <PageHead
        title="Detection quality"
        sub="What the detector has produced on this deployment, and what the service reports about itself"
        right={
          <Chip tone={down ? 'red' : health ? 'green' : 'neutral'} dot>
            {down ? 'Detector unreachable' : health ? 'Detector online' : 'Checking…'}
          </Chip>
        }
      />
      {!stats.configured ? <NotConfigured /> : null}

      <KpiRow>
        <KpiTile label="Uploads" value={stats.uploads.total} sub="files analysed" />
        <KpiTile label="Rejected at the gate" value={stats.uploads.rejected} tone={stats.uploads.rejected ? 'amber' : undefined} sub="not a road, or too blurry" />
        <KpiTile label="Defects found" value={stats.defects.total} />
        <KpiTile label="Became tickets" value={stats.defects.ticketed} tone={stats.defects.ticketed ? 'blue' : undefined} />
        <KpiTile label="Mean confidence" value={stats.defects.meanConfidence ?? '—'} />
      </KpiRow>

      <div className="rs-row" style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        <Panel style={{ flex: 1, minWidth: 0 }}>
          <PanelHead title="Confidence spread" sub="Every stored defect, by the confidence that drove it" />
          <PanelBody>
            {stats.confidenceBands.length ? (
              stats.confidenceBands.map((b) => (
                <div key={b.band} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span className="mono" style={{ width: 92, color: color.a.ink2 }}>{b.band}</span>
                  <Bar value={(b.count / maxBand) * 100} color={color.blueLift} style={{ flex: 1 }} />
                  <span className="num" style={{ fontSize: 13, width: 30, textAlign: 'right' }}>{b.count}</span>
                </div>
              ))
            ) : (
              <p className="tiny" style={{ color: color.a.dim }}>Nothing detected yet.</p>
            )}
            <Inset style={{ marginTop: 12 }}>
              <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
                Detections below the 0.35 threshold are never stored, so the left of this chart is cut off
                by design. Lowering the threshold on upload finds more damage and more false positives.
              </p>
            </Inset>
          </PanelBody>
        </Panel>

        <Panel className="rs-fixed" style={{ width: 400, flexShrink: 0 }}>
          <PanelHead title="Live service" sub="Reported by the detector right now" />
          <PanelBody>
            {health ? (
              <>
                <Row label="Crack model" value={`${health.weights ?? '—'} (${health.weights_kind ?? '—'})`} />
                <Row label="Pothole model" value={`${health.pothole_model ?? '—'} (${health.pothole_model_kind ?? '—'})`} />
                <Row label="Mode" value={health.mode ?? '—'} />
                <Row label="Compute" value={health.cuda ? (health.gpu ?? 'GPU') : 'CPU — roughly 50× slower'} />
                <Row label="Frames analysed here" value={String(stats.framesAnalysed)} />
              </>
            ) : down ? (
              <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
                The detection service is not answering. Uploads will fail until it is back.
              </p>
            ) : (
              <p className="tiny" style={{ color: color.a.dim }}>Asking the service…</p>
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel flush>
        <PanelHead title="By damage class" sub="Counts and mean confidence on this deployment" />
        {stats.byClass.length ? (
          <div style={{ padding: '10px 12px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Class</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Found</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Mean confidence</th>
                  <th scope="col" style={TH}>Share</th>
                </tr>
              </thead>
              <tbody>
                {stats.byClass.map((c) => (
                  <tr key={c.damageClass}>
                    <td style={TD}>{CLASS_LABEL[c.damageClass] ?? c.damageClass}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="num" style={{ fontSize: 13 }}>{c.count}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="mono">{c.meanConfidence.toFixed(2)}</span>
                    </td>
                    <td style={TD}>
                      <Bar value={(c.count / Math.max(1, stats.defects.total)) * 100} color={color.a.ink2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PanelBody>
            <p className="tiny" style={{ color: color.a.dim }}>Nothing detected yet.</p>
          </PanelBody>
        )}
      </Panel>

      <Inset>
        <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
          Held-out accuracy — mAP, precision, recall — is measured against a labelled test set in the ML
          repository, not by this service, so it is not shown here. What this page reports is only what
          this deployment can see for itself.
        </p>
      </Inset>
    </Main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${color.a.lineSoft}` }}>
      <span className="tiny" style={{ color: color.a.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, textAlign: 'right', color: color.a.ink, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
