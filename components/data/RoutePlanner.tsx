'use client';

/**
 * "Where are you going?" — source and destination, then the drive is checked
 * against every defect stored in the database.
 *
 * The map is loaded lazily and client-only: Leaflet touches `window` on import,
 * which would break the server render of the home page.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import { IconSearch } from '@/components/chrome/Icons';
import PlaceField from './PlaceField';
import type { TripResponse } from '@/app/api/trip/route';
import type { Hazard } from '@/lib/routing';
import type { MapPoint } from './TripMap';
import { formatDistance, formatDuration } from '@/lib/geo';
import { color, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL, type Severity } from '@/lib/types';

const TripMap = dynamic(() => import('./TripMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 460,
        borderRadius: 12,
        background: color.c.inset,
        border: `1px solid ${color.c.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color.c.dim,
        fontSize: 12.5,
      }}
    >
      Loading map…
    </div>
  ),
});

const VERDICT: Record<Severity, { tone: 'red' | 'amber' | 'yellow' | 'blue' | 'green'; line: string }> = {
  critical: { tone: 'red', line: 'Severe, large damage sits directly on this route.' },
  high: { tone: 'amber', line: 'Severe damage has been recorded on this route.' },
  medium: { tone: 'yellow', line: 'Moderate damage on the way. Passable, worth knowing.' },
  low: { tone: 'blue', line: 'Minor surface damage only.' },
  good: { tone: 'green', line: 'Nothing worse than surface wear.' },
};

export default function RoutePlanner() {
  const [source, setSource] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [corridor, setCorridor] = React.useState(35);
  const [trip, setTrip] = React.useState<TripResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [stored, setStored] = React.useState<MapPoint[]>([]);

  /**
   * Everything already reported, drawn before anyone searches. A map with no
   * pins on it looks broken; a map showing the city's known damage is useful
   * on its own, and the route search then narrows it.
   */
  React.useEffect(() => {
    let live = true;
    fetch('/api/defects?located=1&limit=500')
      .then((r) => r.json())
      .then((b) => {
        if (!live) return;
        const pts: MapPoint[] = (b.defects ?? [])
          .filter((d: { lat: number | null; lng: number | null }) => d.lat != null && d.lng != null)
          .map((d: MapPoint) => ({
            id: d.id ?? String(Math.random()),
            damageClass: d.damageClass,
            severity: d.severity,
            severityLabel: d.severityLabel,
            lat: d.lat,
            lng: d.lng,
            address: d.address,
            imageUrl: d.imageUrl,
          }));
        setStored(pts);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

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

  function swap() {
    setSource(dest);
    setDest(source);
  }

  const verdict = trip?.worst ? VERDICT[trip.worst] : null;

  return (
    // flexShrink: 0 — the home page is a column flex container inside a 100vh
    // shell, so without this the panel is squeezed and the map gets clipped.
    <Panel flush style={{ flexShrink: 0 }}>
      <PanelHead
        title="Check your drive before you take it"
        sub="Every pothole and crack sent in by a camera, matched against the road you are about to use."
        right={
          trip ? (
            <Chip tone={trip.hazards.length ? (verdict?.tone ?? 'neutral') : 'green'} dot>
              {trip.hazards.length
                ? `${trip.hazards.length} on your way`
                : 'Clear of reported damage'}
            </Chip>
          ) : null
        }
      />

      <PanelBody style={{ padding: 16 }}>
        <form onSubmit={check} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <PlaceField label="Pick-up" value={source} onChange={setSource} placeholder="Dispur, Guwahati" dot="#0A0A0A" />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap pick-up and drop"
            style={{
              height: 38,
              width: 34,
              borderRadius: 9,
              border: `1px solid ${color.c.border}`,
              background: '#FFF',
              color: color.c.muted,
              cursor: 'pointer',
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            ⇅
          </button>
          <PlaceField label="Drop" value={dest} onChange={setDest} placeholder="Six Mile, Guwahati" dot={color.mark} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <span className="lbl" style={{ color: color.c.muted }}>
              Corridor
            </span>
            <select
              value={corridor}
              onChange={(e) => setCorridor(Number(e.target.value))}
              style={{
                height: 38,
                borderRadius: 9,
                border: `1px solid ${color.c.border}`,
                background: '#FFF',
                padding: '0 9px',
                fontSize: 13,
                fontFamily: 'inherit',
                color: color.c.ink,
              }}
            >
              <option value={15}>15 m — same lane</option>
              <option value={35}>35 m — same road</option>
              <option value={80}>80 m — nearby</option>
            </select>
          </label>

          <Btn primary type="submit" disabled={loading || !source.trim() || !dest.trim()} style={{ height: 38 }}>
            <IconSearch size={14} />
            {loading ? 'Checking…' : 'Check this route'}
          </Btn>
        </form>

        {error ? (
          <div
            style={{
              marginTop: 12,
              border: '1px solid #FBDDD9',
              background: '#FFFBFA',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12.5,
              color: color.red,
            }}
          >
            {error}
          </div>
        ) : null}

        {trip?.warning ? (
          <div
            style={{
              marginTop: 12,
              border: '1px solid #FAE7C6',
              background: '#FFFCF5',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12.5,
              color: '#B45E09',
            }}
          >
            {trip.warning}
          </div>
        ) : null}

        <div className="rs-row" style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TripMap
              route={trip?.route.coordinates ?? []}
              hazards={trip ? trip.hazards : stored}
              source={trip?.source}
              destination={trip?.destination}
              onSelect={setSelected}
            />
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {trip ? (
                <>
                  <Metric label="Distance" value={formatDistance(trip.route.distanceM)} />
                  <Metric label="Driving time" value={formatDuration(trip.route.durationS)} />
                  <Metric label="On your path" value={`${trip.hazards.length}`} />
                  <Metric label="Checked within" value={`${trip.corridorM} m`} />
                </>
              ) : (
                <Metric label="Reported damage on the map" value={`${stored.length}`} />
              )}
            </div>
          </div>

          <div
            className="rs-fixed"
            style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {!trip ? (
              <Inset>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.014em' }}>
                  {stored.length
                    ? `${stored.length} reported defect${stored.length === 1 ? '' : 's'} on the map`
                    : 'Nothing reported yet'}
                </div>
                <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.5 }}>
                  {stored.length
                    ? 'Put in where you are starting and where you are going to see which of these sit on your drive.'
                    : 'Send in a road from the Upload page and every defect found lands here, ready to be matched against other people\u2019s routes.'}
                </div>
              </Inset>
            ) : verdict && trip.hazards.length ? (
              <Inset style={{ borderColor: '#EDEDED' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '-0.014em',
                    color: toneColor(verdict.tone, 'light'),
                  }}
                >
                  {verdict.line}
                </div>
                <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.5 }}>
                  {trip.scanned} recorded defects sit near this corridor; {trip.hazards.length} are on
                  the road itself.
                </div>
              </Inset>
              ) : (
              <Inset>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.014em', color: color.green }}>
                  Nothing reported on this route.
                </div>
                <div className="tiny" style={{ color: color.c.muted, marginTop: 5, lineHeight: 1.5 }}>
                  That means nobody has driven it with a camera yet as often as it means the road is
                  sound. Absence of a report is not a clean bill.
                </div>
              </Inset>
              )}

            <div className="scrollarea" style={{ maxHeight: 430, overflowY: 'auto', paddingRight: 4 }}>
              {(trip?.hazards ?? []).map((h) => (
                <HazardRow key={h.id} h={h} active={selected === h.id} onClick={() => setSelected(h.id)} />
              ))}
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="num" style={{ fontSize: 18, display: 'block' }}>
        {value}
      </span>
      <span className="tiny" style={{ color: color.c.muted }}>
        {label}
      </span>
    </span>
  );
}

function HazardRow({ h, active, onClick }: { h: Hazard; active: boolean; onClick: () => void }) {
  const tone = severityTone[h.severity];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 11,
        width: '100%',
        textAlign: 'left',
        padding: '10px 8px',
        border: 'none',
        borderBottom: '1px solid #F5F5F5',
        background: active ? color.c.inset : 'transparent',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: 'inherit',
        alignItems: 'center',
      }}
    >
      <span style={{ width: 54, flexShrink: 0 }}>
        <span className="num" style={{ fontSize: 16, color: toneColor(tone, 'light') }}>
          {h.alongM < 1000 ? h.alongM : (h.alongM / 1000).toFixed(1)}
        </span>
        <span style={{ fontSize: 10.5, marginLeft: 2, color: toneColor(tone, 'light') }}>
          {h.alongM < 1000 ? 'm' : 'km'}
        </span>
        <span className="tiny" style={{ color: color.c.dim, display: 'block', marginTop: 2 }}>
          in
        </span>
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={h.imageUrl}
        alt=""
        style={{
          width: 58,
          height: 40,
          objectFit: 'cover',
          borderRadius: 6,
          border: `1px solid ${color.c.line}`,
          flexShrink: 0,
          background: color.c.inset,
        }}
      />

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.011em' }}>
          {CLASS_LABEL[h.damageClass] ?? h.damageClass}
        </span>
        <span
          className="tiny"
          style={{
            color: color.c.muted,
            display: 'block',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {h.address ?? `${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}`}
        </span>
        <span className="tiny" style={{ color: color.c.dim, display: 'block', marginTop: 2 }}>
          {h.offsetM} m off the line · {(h.confidence * 100).toFixed(0)}% sure
        </span>
      </span>

      <Chip tone={tone}>{h.severityLabel}</Chip>
    </button>
  );
}
