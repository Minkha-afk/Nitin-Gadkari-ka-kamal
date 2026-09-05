'use client';

/**
 * The route check: two places in, a verdict out.
 *
 * The hero variant puts the inputs on ink and leads with a single sentence of
 * verdict — "Three things on your way, worst is critical" — before any table.
 * A driver wants the answer, then the detail, in that order.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Eyebrow, Figure, Pill, SevBadge, SEV } from '@/components/citizen/ui';
import PlaceField from './PlaceField';
import type { TripResponse } from '@/app/api/trip/route';
import type { Hazard } from '@/lib/routing';
import { formatDistance, formatDuration } from '@/lib/geo';
import { CLASS_LABEL, type Severity } from '@/lib/types';

const TripMap = dynamic(() => import('./TripMap'), {
  ssr: false,
  loading: () => <div style={{ height: 420, background: '#EFEDE9', borderRadius: 20 }} />,
});

const VERDICT: Record<Severity, string> = {
  critical: 'Severe, wide damage sits directly on this route.',
  high: 'Severe damage has been reported on this route.',
  medium: 'Moderate damage on the way. Passable, worth knowing.',
  low: 'Minor surface damage only.',
  good: 'Nothing worse than surface wear.',
};

export default function RoutePlanner() {
  const [source, setSource] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [corridor, setCorridor] = React.useState(35);
  const [trip, setTrip] = React.useState<TripResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    if (!source.trim() || !dest.trim()) return;
    setLoading(true);
    setError(null);
    setTrip(null);
    try {
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source, destination: dest, corridorM: corridor }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `route lookup failed (${res.status})`);
      setTrip(body as TripResponse);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-lg">
      <form onSubmit={check} className="stack-md">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <PlaceField label="From" value={source} onChange={setSource} placeholder="Where you start" dot="#F7F5F2" tone="ink" />
          <PlaceField label="To" value={dest} onChange={setDest} placeholder="Where you are going" dot="#F2B01E" tone="ink" />
          <Pill variant="mark" disabled={loading || !source.trim() || !dest.trim()} style={{ height: 54, padding: '0 30px' }}>
            {loading ? 'Checking…' : 'Check the road'}
          </Pill>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Eyebrow style={{ color: 'rgba(247,245,242,0.4)', marginRight: 4 }}>Count damage within</Eyebrow>
          {[
            [15, 'my lane'],
            [35, 'my road'],
            [80, 'nearby'],
          ].map(([m, text]) => (
            <button
              key={m as number}
              type="button"
              onClick={() => setCorridor(m as number)}
              className={`pill pill-sm ${corridor === m ? 'pill-mark' : 'pill-on-ink'}`}
            >
              {m} m · {text}
            </button>
          ))}
        </div>
      </form>

      {error ? (
        <p style={{ color: '#FDA29B', fontSize: 14, margin: 0 }}>{error}</p>
      ) : null}
      {trip?.warning ? (
        <p style={{ color: '#FEC84B', fontSize: 14, margin: 0 }}>{trip.warning}</p>
      ) : null}

      {trip ? <Verdict trip={trip} /> : null}
    </div>
  );
}

function Verdict({ trip }: { trip: TripResponse }) {
  const worst = trip.worst;
  const clear = trip.hazards.length === 0;

  return (
    <div className="stack-lg rise">
      {/* the answer, before any detail */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Eyebrow style={{ color: 'rgba(247,245,242,0.45)' }}>
            {trip.source.label.split(',')[0]} → {trip.destination.label.split(',')[0]}
          </Eyebrow>
          <p
            className="display-sm"
            style={{ marginTop: 14, color: clear ? '#7FE0AC' : worst ? SEV[worst].ink : '#F7F5F2' }}
          >
            {clear ? 'Nothing reported on this route.' : VERDICT[worst ?? 'low']}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          <Figure value={trip.hazards.length} label="on your way" onInk tint={clear ? '#7FE0AC' : undefined} />
          <Figure value={formatDuration(trip.route.durationS)} label="drive" onInk />
          <Figure value={formatDistance(trip.route.distanceM)} label="distance" onInk />
        </div>
      </div>

      <div style={{ borderRadius: 20, overflow: 'hidden' }}>
        <TripMap
          route={trip.route.coordinates}
          hazards={trip.hazards}
          source={trip.source}
          destination={trip.destination}
          height={420}
        />
      </div>

      {trip.hazards.length ? (
        <div className="rail">
          {trip.hazards.map((h) => (
            <HazardCard key={h.id} h={h} />
          ))}
        </div>
      ) : (
        <p className="copy" style={{ color: 'rgba(247,245,242,0.55)', maxWidth: '62ch' }}>
          Nobody has driven this route with a camera yet, which is not the same as the road being sound.
          Absence of a report is absence of evidence.
        </p>
      )}
    </div>
  );
}

function HazardCard({ h }: { h: Hazard }) {
  return (
    <article
      style={{
        width: 232,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 12,
      }}
    >
      <div className="shot" style={{ aspectRatio: '16 / 10', borderRadius: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={h.imageUrl} alt="" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 13 }}>
        <span className="figure" style={{ fontSize: 27, color: SEV[h.severity].ink }}>
          {h.alongM < 1000 ? h.alongM : (h.alongM / 1000).toFixed(1)}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(247,245,242,0.5)' }}>
          {h.alongM < 1000 ? 'm' : 'km'} in
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: '#F7F5F2' }}>
        {CLASS_LABEL[h.damageClass] ?? h.damageClass}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'rgba(247,245,242,0.45)',
          marginTop: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {h.address ?? `${h.offsetM} m off the line`}
      </div>
      <div style={{ marginTop: 11 }}>
        <SevBadge severity={h.severity} />
      </div>
    </article>
  );
}
