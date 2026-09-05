'use client';

/**
 * Two places, every way OSRM will drive between them, ranked by what the
 * surface is actually like rather than by time alone.
 */

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import PlaceField from '@/components/data/PlaceField';
import { IconSearch } from '@/components/chrome/Icons';
import type { CompareResponse, RouteOption } from '@/app/api/routes/compare/route';
import type { Stretch } from '@/lib/overview';
import { formatDistance, formatDuration } from '@/lib/geo';
import { color, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL } from '@/lib/types';

const TripMap = dynamic(() => import('@/components/data/TripMap'), {
  ssr: false,
  loading: () => <div style={{ height: 430, background: color.c.inset, borderRadius: 12 }} />,
});

const LABEL_TONE = {
  smoothest: 'green',
  fastest: 'blue',
  shortest: 'neutral',
} as const;

export default function RoutesClient({ stretches }: { stretches: Stretch[] }) {
  const [source, setSource] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [result, setResult] = React.useState<CompareResponse | null>(null);
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selected = result?.options.find((o) => o.id === chosen) ?? result?.options[0] ?? null;

  async function compare(e?: React.FormEvent) {
    e?.preventDefault();
    if (!source.trim() || !dest.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/routes/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source, destination: dest }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `comparison failed (${res.status})`);
      setResult(body as CompareResponse);
      setChosen((body as CompareResponse).options[0]?.id ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="scrollarea rs-row"
      style={{ padding: '20px 28px', display: 'flex', gap: 18, flex: 1, alignItems: 'flex-start' }}
    >
      <div className="rs-fixed" style={{ width: 880, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h1 className="h1">Pick the road, not just the time</h1>
          <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
            Every way there, ranked by reported damage per kilometre. The quickest route is often not
            the one you want on two wheels.
          </p>
        </div>

        <Panel>
          <PanelBody style={{ padding: 14 }}>
            <form onSubmit={compare} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <PlaceField label="From" value={source} onChange={setSource} placeholder="Where you start" dot="#0A0A0A" />
              <PlaceField label="To" value={dest} onChange={setDest} placeholder="Where you are going" dot={color.mark} />
              <Btn primary type="submit" disabled={loading || !source.trim() || !dest.trim()} style={{ height: 38 }}>
                <IconSearch size={14} />
                {loading ? 'Comparing…' : 'Compare routes'}
              </Btn>
            </form>

            {error ? (
              <div style={{ marginTop: 12, fontSize: 12.5, color: color.red }}>{error}</div>
            ) : null}
            {result?.warning ? (
              <div style={{ marginTop: 12, fontSize: 12.5, color: '#B45E09' }}>{result.warning}</div>
            ) : null}
          </PanelBody>
        </Panel>

        {selected ? (
          <Panel flush>
            <TripMap
              route={selected.coordinates}
              hazards={selected.hazards}
              source={result!.source}
              destination={result!.destination}
              height={430}
            />
          </Panel>
        ) : null}

        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.options.map((o) => (
              <OptionCard
                key={o.id}
                o={o}
                active={o.id === selected?.id}
                onPick={() => setChosen(o.id)}
                corridorM={result.corridorM}
              />
            ))}
          </div>
        ) : (
          <Panel>
            <PanelBody>
              <p className="sub" style={{ color: color.c.muted, lineHeight: 1.6 }}>
                Put in two places to compare. Routes come from OpenStreetMap; the damage on them comes
                from what drivers have already sent in, so a route with nothing reported means nobody has
                driven it with a camera — not that it is smooth.
              </p>
            </PanelBody>
          </Panel>
        )}
      </div>

      <div className="rs-fixed" style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Panel>
          <PanelHead
            title="Stretches with the most reported damage"
            sub={stretches.length ? 'By street, worst first' : undefined}
          />
          <PanelBody style={{ paddingTop: 8 }}>
            {stretches.length ? (
              stretches.map((s, i) => (
                <div
                  key={s.address}
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < stretches.length - 1 ? '1px solid #F5F5F5' : undefined,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.imageUrl}
                    alt=""
                    style={{
                      width: 56,
                      height: 38,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: `1px solid ${color.c.line}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12.5,
                        fontWeight: 600,
                        letterSpacing: '-0.011em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.address}
                    </span>
                    <span className="tiny" style={{ color: color.c.muted, display: 'block', marginTop: 3 }}>
                      {s.count} defect{s.count === 1 ? '' : 's'}
                      {s.openTickets ? ` · ${s.openTickets} ticketed` : ''}
                    </span>
                  </span>
                  <Chip tone={severityTone[s.worst]}>{s.worst}</Chip>
                </div>
              ))
            ) : (
              <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.6 }}>
                No streets named yet. A street name is attached when a defect is reverse geocoded during
                analysis — turn on <em>Look up street names</em> on the{' '}
                <Link href="/upload" style={{ color: color.blue }}>
                  Upload
                </Link>{' '}
                page.
              </p>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function OptionCard({
  o,
  active,
  onPick,
  corridorM,
}: {
  o: RouteOption;
  active: boolean;
  onPick: () => void;
  corridorM: number;
}) {
  const tone = o.worst ? severityTone[o.worst] : 'green';
  return (
    <Panel
      onClick={onPick}
      style={{
        padding: 14,
        cursor: 'pointer',
        borderColor: active ? '#0A0A0A' : color.c.line,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {o.labels.map((l) => (
          <Chip key={l} tone={LABEL_TONE[l]} dot={l === 'smoothest'}>
            {l}
          </Chip>
        ))}
        {!o.labels.length ? <Chip tone="neutral">alternative</Chip> : null}
        <span style={{ flex: 1 }} />
        <span className="num" style={{ fontSize: 18 }}>
          {formatDuration(o.durationS)}
        </span>
        <span className="tiny" style={{ color: color.c.muted }}>
          {formatDistance(o.distanceM)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
        <Stat
          label="on this route"
          value={`${o.hazards.length}`}
          tint={o.hazards.length ? toneColor(tone, 'light') : color.green}
        />
        <Stat label="damage per km" value={o.roughPerKm.toFixed(1)} />
        <Stat
          label="worst on it"
          value={o.worst ?? 'nothing reported'}
          tint={o.worst ? toneColor(tone, 'light') : color.green}
        />
        {o.slowerByS > 30 ? <Stat label="slower by" value={formatDuration(o.slowerByS)} /> : null}
      </div>

      {o.hazards.length ? (
        <Inset style={{ marginTop: 12 }}>
          <div className="tiny" style={{ color: color.c.muted, lineHeight: 1.55 }}>
            {o.hazards
              .slice(0, 4)
              .map(
                (h) =>
                  `${CLASS_LABEL[h.damageClass] ?? h.damageClass} at ${(h.alongM / 1000).toFixed(1)} km`,
              )
              .join(' · ')}
            {o.hazards.length > 4 ? ` · and ${o.hazards.length - 4} more` : ''}
          </div>
        </Inset>
      ) : (
        <div className="tiny" style={{ color: color.c.muted, marginTop: 10, lineHeight: 1.55 }}>
          Nothing reported within {corridorM} m of this line. That is an absence of reports, not a
          guarantee of a good surface.
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <span>
      <span className="num" style={{ fontSize: 17, display: 'block', color: tint, textTransform: 'capitalize' }}>
        {value}
      </span>
      <span className="tiny" style={{ color: color.c.muted }}>
        {label}
      </span>
    </span>
  );
}
