'use client';

/**
 * Drive — a heads-up view of reported damage around where you actually are.
 *
 * Position comes from the browser's Geolocation API, so it needs permission and
 * only works over https or on localhost. Nothing is simulated: with no fix, the
 * screen says it has no fix.
 */

import React from 'react';
import Link from 'next/link';
import { Btn, Chip } from '@/components/system';
import { color, severityColor, severityTone, toneColor } from '@/lib/tokens';
import { CLASS_LABEL, type DamageClass, type Severity } from '@/lib/types';

interface Nearby {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  confidence: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  imageUrl: string;
  ticketId: string | null;
  distanceM: number | null;
}

const RADIUS_M = 2000;

export default function DrivePage() {
  const [pos, setPos] = React.useState<GeolocationPosition | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [watching, setWatching] = React.useState(false);
  const [rows, setRows] = React.useState<Nearby[]>([]);
  const [configured, setConfigured] = React.useState(true);
  const watchId = React.useRef<number | null>(null);

  function start() {
    if (!('geolocation' in navigator)) {
      setError('This browser has no geolocation.');
      return;
    }
    setError(null);
    setWatching(true);
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setPos(p),
      (e) => {
        setError(
          e.code === e.PERMISSION_DENIED
            ? 'Location permission denied. Nothing here works without it.'
            : e.message,
        );
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setWatching(false);
  }

  React.useEffect(() => () => stop(), []);

  // Refetch when the fix moves. Rounding to ~50 m keeps a stationary phone from
  // hammering the endpoint on every GPS jitter.
  const key = pos ? `${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}` : null;
  React.useEffect(() => {
    if (!pos) return;
    let live = true;
    fetch(`/api/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusM=${RADIUS_M}`)
      .then((r) => r.json())
      .then((b) => {
        if (!live) return;
        setRows(b.defects ?? []);
        setConfigured(b.configured !== false);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const speedKmh = pos?.coords.speed != null && pos.coords.speed >= 0 ? pos.coords.speed * 3.6 : null;
  const nearest = rows[0];

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '22px 26px', gap: 18, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="h1" style={{ color: color.a.ink }}>Drive</h1>
          <p className="sub" style={{ color: color.a.muted, marginTop: 7 }}>
            Reported damage within {RADIUS_M / 1000} km of where you are, nearest first.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/">
            <Btn>Leave</Btn>
          </Link>
          {watching ? <Btn onClick={stop}>Stop</Btn> : <Btn primary onClick={start}>Start</Btn>}
        </div>
      </div>

      {error ? (
        <div style={{ border: `1px solid #3A1A18`, background: '#150E0D', borderRadius: 12, padding: '12px 14px', color: color.redLift, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      {!configured ? (
        <div style={{ color: color.a.muted, fontSize: 13 }}>
          No road database connected, so there is nothing to warn you about.
        </div>
      ) : null}

      {!pos ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: color.a.muted,
            textAlign: 'center',
            padding: 30,
          }}
        >
          <span className="h1" style={{ color: color.a.ink2 }}>No fix</span>
          <span className="sub" style={{ color: color.a.muted, maxWidth: 420, lineHeight: 1.6 }}>
            {watching
              ? 'Waiting for the first position from the device…'
              : 'Press Start and allow location. This screen shows what other drivers have already reported around you — it does not invent a drive.'}
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <Tile label="Nearest hazard" value={nearest?.distanceM != null ? `${nearest.distanceM} m` : '—'} tint={nearest ? severityColor(nearest.severity, 'dark') : undefined} />
            <Tile label={`Within ${RADIUS_M / 1000} km`} value={String(rows.length)} />
            <Tile label="Speed" value={speedKmh != null ? `${speedKmh.toFixed(0)} km/h` : '—'} />
            <Tile label="Fix accuracy" value={`±${pos.coords.accuracy.toFixed(0)} m`} />
          </div>

          {nearest ? (
            <div
              style={{
                border: `1px solid ${severityColor(nearest.severity, 'dark')}`,
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nearest.imageUrl} alt="" style={{ width: 132, height: 84, objectFit: 'cover', borderRadius: 9, border: `1px solid ${color.a.line}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="num" style={{ fontSize: 34, color: severityColor(nearest.severity, 'dark') }}>
                  {nearest.distanceM} m
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: color.a.ink }}>
                  {CLASS_LABEL[nearest.damageClass] ?? nearest.damageClass} · {nearest.severityLabel}
                </div>
                <div className="tiny" style={{ color: color.a.muted, marginTop: 4 }}>
                  {nearest.address ?? 'no street name'}
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.slice(1).map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '11px 0',
                  borderBottom: i < rows.length - 2 ? `1px solid ${color.a.lineSoft}` : undefined,
                }}
              >
                <span className="num" style={{ width: 74, fontSize: 17, color: toneColor(severityTone[d.severity], 'dark') }}>
                  {d.distanceM} m
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, color: color.a.ink }}>
                    {CLASS_LABEL[d.damageClass] ?? d.damageClass}
                  </span>
                  <span className="tiny" style={{ color: color.a.dim }}>
                    {d.address ?? 'no street name'}
                  </span>
                </span>
                <Chip tone={severityTone[d.severity]}>{d.severityLabel}</Chip>
              </div>
            ))}
            {rows.length === 0 ? (
              <p className="sub" style={{ color: color.a.muted, lineHeight: 1.6 }}>
                Nothing reported within {RADIUS_M / 1000} km of you. That means nobody has driven this
                area with a camera — not that the roads are sound.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div style={{ border: `1px solid ${color.a.line}`, borderRadius: 12, padding: '12px 14px' }}>
      <div className="num" style={{ fontSize: 26, color: tint ?? color.a.ink }}>{value}</div>
      <div className="tiny" style={{ color: color.a.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}
