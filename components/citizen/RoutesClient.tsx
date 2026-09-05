'use client';

/**
 * Route comparison.
 *
 * The decision this page exists for is one trade: minutes against potholes.
 * So the options are big cards that say the trade out loud — "4 min slower,
 * nine fewer defects" — rather than a table of metrics to work out yourself.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import PlaceField from '@/components/data/PlaceField';
import { Empty, Eyebrow, Figure, Pill, SectionHead, SEV } from './ui';
import type { CompareResponse, RouteOption } from '@/app/api/routes/compare/route';
import type { Stretch } from '@/lib/overview';
import { formatDistance, formatDuration } from '@/lib/geo';
import { CLASS_LABEL } from '@/lib/types';

const TripMap = dynamic(() => import('@/components/data/TripMap'), {
  ssr: false,
  loading: () => <div style={{ height: 460, background: '#EFEDE9', borderRadius: 20 }} />,
});

const LABEL_COPY: Record<string, string> = {
  smoothest: 'Smoothest',
  fastest: 'Fastest',
  shortest: 'Shortest',
};

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
    <div className="stack-xl" style={{ paddingTop: 48 }}>
      <section className="shell">
        <Eyebrow>Routes</Eyebrow>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '13ch' }}>
          The fastest way is rarely the kindest.
        </h1>
        <p className="lede" style={{ marginTop: 18 }}>
          Every way there, ranked by reported damage per kilometre — not by minutes alone.
        </p>

        <form onSubmit={compare} style={{ marginTop: 34, display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <PlaceField label="From" value={source} onChange={setSource} placeholder="Where you start" dot="#0A0A0A" />
          <PlaceField label="To" value={dest} onChange={setDest} placeholder="Where you are going" dot="#F2B01E" />
          <Pill
            type="submit"
            variant="solid"
            disabled={loading || !source.trim() || !dest.trim()}
            style={{ height: 54, padding: '0 28px' }}
          >
            {loading ? 'Comparing…' : 'Compare'}
          </Pill>
        </form>

        {error ? <p className="copy" style={{ marginTop: 16, color: SEV.critical.ink }}>{error}</p> : null}
        {result?.warning ? <p className="copy" style={{ marginTop: 16, color: SEV.medium.ink }}>{result.warning}</p> : null}
      </section>

      {selected ? (
        <section className="shell rise" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <TripMap
            route={selected.coordinates}
            hazards={selected.hazards}
            source={result!.source}
            destination={result!.destination}
            height={460}
          />
        </section>
      ) : null}

      {result ? (
        <section className="shell stack-md">
          <SectionHead kicker="Your options" title={`${result.options.length} way${result.options.length === 1 ? '' : 's'} there`} />
          <div style={{ height: 8 }} />
          {result.options.map((o) => (
            <OptionCard
              key={o.id}
              o={o}
              active={o.id === selected?.id}
              onPick={() => setChosen(o.id)}
              corridorM={result.corridorM}
            />
          ))}
        </section>
      ) : (
        <section className="shell">
          <Empty
            kicker="How it works"
            title="Two places, every road between them"
            body="Routes come from OpenStreetMap; the damage on them comes from what drivers have already sent in. A route with nothing reported means nobody has filmed it — not that it is smooth."
          />
        </section>
      )}

      {/* ── worst streets ────────────────────────────────────────────── */}
      {stretches.length ? (
        <section className="stack-lg">
          <div className="shell">
            <SectionHead kicker="Avoid" title="Worst streets on record" sub="By reported damage, worst first" />
          </div>
          <div className="rail shell">
            {stretches.map((s) => (
              <article key={s.address} className="card card-interactive" style={{ width: 256, padding: 10 }}>
                <div className="shot shot-wash" style={{ aspectRatio: '4 / 3', borderRadius: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt="" />
                  <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, zIndex: 2 }}>
                    <span className="figure" style={{ fontSize: 30, color: '#fff' }}>{s.count}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 7 }}>
                      defect{s.count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '12px 5px 4px' }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 650,
                      letterSpacing: '-0.014em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.address}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: SEV[s.worst].ink }} />
                    <Eyebrow>
                      {SEV[s.worst].label}
                      {s.openTickets ? ` · ${s.openTickets} ticketed` : ''}
                    </Eyebrow>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
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
  const clear = o.hazards.length === 0;
  const tint = o.worst ? SEV[o.worst].ink : SEV.good.ink;
  const isSmoothest = o.labels.includes('smoothest');

  return (
    <article
      onClick={onPick}
      className="card card-interactive"
      style={{
        padding: 'clamp(20px, 2.6vw, 30px)',
        borderColor: active ? 'var(--ink)' : undefined,
        boxShadow: active ? '0 0 0 1.5px var(--ink), var(--lift-1)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {o.labels.length ? (
          o.labels.map((l) => (
            <span
              key={l}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 28,
                padding: '0 13px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: l === 'smoothest' ? SEV.good.wash : '#F2F0EC',
                color: l === 'smoothest' ? SEV.good.ink : 'var(--ink-2)',
              }}
            >
              {LABEL_COPY[l] ?? l}
            </span>
          ))
        ) : (
          <Eyebrow>Alternative</Eyebrow>
        )}
      </div>

      <div style={{ display: 'flex', gap: 44, marginTop: 22, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Figure value={formatDuration(o.durationS)} label="drive time" />
        <Figure value={formatDistance(o.distanceM)} label="distance" />
        <Figure
          value={clear ? 'none' : o.hazards.length}
          label="defects on it"
          tint={clear ? SEV.good.ink : tint}
        />
        <Figure value={o.roughPerKm.toFixed(1)} label="damage per km" />
      </div>

      <p className="copy" style={{ marginTop: 22, maxWidth: '64ch' }}>
        {clear ? (
          <>Nothing reported within {corridorM} m of this line — an absence of reports, not a guarantee.</>
        ) : (
          <>
            {isSmoothest && o.slowerByS > 30 ? (
              <strong style={{ color: 'var(--ink)' }}>
                {formatDuration(o.slowerByS)} slower, and the gentlest road of the {' '}
                {o.hazards.length === 1 ? 'lot' : 'lot'}.{' '}
              </strong>
            ) : null}
            {o.hazards
              .slice(0, 3)
              .map((h) => `${CLASS_LABEL[h.damageClass] ?? h.damageClass} at ${(h.alongM / 1000).toFixed(1)} km`)
              .join(' · ')}
            {o.hazards.length > 3 ? ` · and ${o.hazards.length - 3} more` : ''}
          </>
        )}
      </p>
    </article>
  );
}
