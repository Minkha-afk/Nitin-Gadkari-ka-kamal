'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, Chip, Inset, KpiRow, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import { NotConfigured, TD, TH } from './bits';
import type { ContractorRow } from '@/lib/authority';
import { color } from '@/lib/tokens';

export default function ContractorsClient({ rows, configured }: { rows: ContractorRow[]; configured: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [panel, setPanel] = React.useState('');
  const [rate, setRate] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          _id: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: name.trim(),
          panel: panel.trim() || null,
          ratePerM2: rate ? Number(rate) : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'could not add');
      setName('');
      setPanel('');
      setRate('');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const totalOpen = rows.reduce((n, r) => n + r.openLoad, 0);
  const totalClosed = rows.reduce((n, r) => n + r.closed, 0);
  const totalReopened = rows.reduce((n, r) => n + r.reopened, 0);

  return (
    <Main wide>
      <PageHead
        title="Contractors"
        sub="Load and repeat-work counted from the tickets they were actually assigned"
      />
      {!configured ? <NotConfigured /> : null}

      <KpiRow>
        <KpiTile label="On the panel" value={rows.length} />
        <KpiTile label="Open work" value={totalOpen} sub="assigned or repaired" />
        <KpiTile label="Finished" value={totalClosed} tone={totalClosed ? 'green' : undefined} />
        <KpiTile label="Came back" value={totalReopened} tone={totalReopened ? 'red' : undefined} />
        <KpiTile
          label="Repeat rate"
          value={totalClosed + totalReopened ? `${Math.round((totalReopened / (totalClosed + totalReopened)) * 100)}%` : '—'}
        />
      </KpiRow>

      <Panel flush>
        <PanelHead title="Panel" />
        {rows.length ? (
          <div style={{ padding: '10px 12px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Contractor</th>
                  <th scope="col" style={TH}>Panel</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Open</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Finished</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Came back</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Median days</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Rate /m²</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td style={TD}>
                      <div style={{ fontWeight: 500, fontSize: 12.5 }}>{c.name}</div>
                      <div className="mono" style={{ color: color.a.dim, marginTop: 3 }}>{c.id}</div>
                    </td>
                    <td style={TD}>
                      <span className="tiny" style={{ color: color.a.ink2 }}>{c.panel ?? '—'}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="num" style={{ fontSize: 13 }}>{c.openLoad}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="num" style={{ fontSize: 13 }}>{c.closed}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      {c.reopened ? <Chip tone="red">{c.reopened}</Chip> : <span className="mono" style={{ color: color.a.dim }}>0</span>}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="mono">{c.medianDays ?? '—'}</span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span className="mono">{c.ratePerM2 ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PanelBody>
            <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6 }}>
              No contractors registered. A ticket cannot be assigned until one is — add the first below.
              Nothing is seeded, because a contractor is a real firm with a real contract.
            </p>
          </PanelBody>
        )}
      </Panel>

      <Panel>
        <PanelHead title="Add to the panel" />
        <PanelBody>
          <form onSubmit={add} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Name" value={name} onChange={setName} placeholder="Firm name" />
            <Field label="Panel / agreement" value={panel} onChange={setPanel} placeholder="e.g. GMC annual rate contract" />
            <Field label="Rate per m²" value={rate} onChange={setRate} placeholder="₹" width={120} />
            <Btn primary type="submit" disabled={busy || !name.trim()} style={{ height: 34 }}>
              {busy ? 'Adding…' : 'Add contractor'}
            </Btn>
          </form>
          {error ? <div className="tiny" style={{ color: color.redLift, marginTop: 10 }}>{error}</div> : null}
          <Inset style={{ marginTop: 12 }}>
            <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: color.a.ink2 }}>Came back</strong> counts tickets reopened after this
              contractor marked them repaired. It is the only quality number here that is not
              self-reported.
            </p>
          </Inset>
        </PanelBody>
      </Panel>
    </Main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  width,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  width?: number;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: width ? '0 0 auto' : 1, minWidth: width ?? 180 }}>
      <span className="lbl" style={{ color: color.a.muted }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 34,
          width: width ?? '100%',
          borderRadius: 8,
          border: `1px solid ${color.a.border}`,
          background: color.a.control,
          color: color.a.ink,
          padding: '0 9px',
          fontSize: 12.5,
          fontFamily: 'inherit',
        }}
      />
    </label>
  );
}
