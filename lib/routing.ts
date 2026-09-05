/**
 * Routing and the corridor engine, shared by /api/trip and /api/routes/compare.
 *
 * Free services, no keys: Nominatim geocodes, OSRM routes. Both are
 * community-run and rate-limited, which is why they are only ever called from
 * the server — a real User-Agent gets sent, and one page view cannot fan out
 * into a hundred lookups.
 */

import { bboxOf, pathLength, pointToPath, type LatLng } from './geo';
import { defects, type DefectDoc } from './mongo';
import type { DamageClass, Severity } from './types';

const UA = 'RoadSense/0.1 (road damage reporting)';
const OSRM = (process.env.OSRM_BASE ?? 'https://router.project-osrm.org').replace(/\/+$/, '');
export const DEFAULT_CORRIDOR_M = 35;

export interface Endpoint extends LatLng {
  label: string;
}

export interface RouteGeometry {
  distanceM: number;
  durationS: number;
  coordinates: LatLng[];
}

export interface Hazard {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  confidence: number;
  lat: number;
  lng: number;
  address: string | null;
  imageUrl: string;
  mapsUrl: string | null;
  sightings: number;
  capturedAt: string;
  ticketId: string | null;
  /** Metres from the route line — how squarely it sits in your path. */
  offsetM: number;
  /** Metres from the start of the route — where you will meet it. */
  alongM: number;
}

export async function resolvePlace(input: unknown, which: string): Promise<Endpoint> {
  if (input && typeof input === 'object' && 'lat' in input && 'lng' in input) {
    const p = input as Partial<Endpoint>;
    if (typeof p.lat === 'number' && typeof p.lng === 'number') {
      return { lat: p.lat, lng: p.lng, label: p.label ?? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` };
    }
  }
  const q = String(input ?? '').trim();
  if (!q) throw new Error(`${which} is empty`);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  const cc = process.env.GEOCODE_COUNTRY ?? 'in';
  if (cc) url.searchParams.set('countrycodes', cc);

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const hits = res.ok ? ((await res.json()) as { display_name: string; lat: string; lon: string }[]) : [];
  if (!hits.length) throw new Error(`could not find "${q}" on the map`);
  return { label: hits[0].display_name, lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
}

/** One driving route, or several when `alternatives` is set. */
export async function driveRoutes(a: Endpoint, b: Endpoint, alternatives = false): Promise<RouteGeometry[]> {
  const url =
    `${OSRM}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?overview=full&geometries=geojson&steps=false&alternatives=${alternatives ? '3' : 'false'}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`routing service returned ${res.status}`);
  const body = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  if (body.code !== 'Ok' || !body.routes?.length) {
    throw new Error('no drivable route between those two places');
  }
  // OSRM speaks GeoJSON, so [lon, lat]. Flipping this is the classic bug.
  return body.routes.map((r) => {
    const coordinates: LatLng[] = r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    return { distanceM: r.distance || pathLength(coordinates), durationS: r.duration, coordinates };
  });
}

/**
 * Every stored defect within `corridorM` of the line.
 *
 * Two stages on purpose: Mongo narrows to the route's bounding box using the
 * 2dsphere index, then exact point-to-polyline distance runs in JS over that
 * shortlist. A box around a diagonal route contains a lot of city the route
 * never touches, and the second stage is what makes the corridor mean anything.
 */
export async function hazardsAlong(path: LatLng[], corridorM: number) {
  const box = bboxOf(path, corridorM + 50);
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [box.minLng, box.minLat],
        [box.maxLng, box.minLat],
        [box.maxLng, box.maxLat],
        [box.minLng, box.maxLat],
        [box.minLng, box.minLat],
      ],
    ],
  };

  const col = await defects();
  const near = (await col
    .find({ location: { $geoWithin: { $geometry: polygon } } })
    .limit(5000)
    .toArray()) as DefectDoc[];

  const hazards: Hazard[] = [];
  for (const d of near) {
    if (d.lat == null || d.lng == null) continue;
    const { dist, along } = pointToPath({ lat: d.lat, lng: d.lng }, path);
    if (dist > corridorM) continue;
    hazards.push({
      id: d._id,
      damageClass: d.damageClass,
      severity: d.severity,
      severityLabel: d.severityLabel,
      confidence: d.confidence,
      lat: d.lat,
      lng: d.lng,
      address: d.address,
      imageUrl: d.imageUrl,
      mapsUrl: d.mapsUrl,
      sightings: d.sightings,
      capturedAt: d.capturedAt,
      ticketId: d.ticketId,
      offsetM: Math.round(dist),
      alongM: Math.round(along),
    });
  }
  hazards.sort((x, y) => x.alongM - y.alongM);
  return { hazards, scanned: near.length };
}

/** How bad a defect is to drive over, for ranking one route against another. */
const WEIGHT: Record<Severity, number> = { critical: 10, high: 6, medium: 3, low: 1, good: 0 };

export const RANK: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Roughness per kilometre. Per km rather than total, so a longer detour is not
 * punished for being longer — the question is what the surface is like.
 */
export function roughness(hazards: Hazard[], distanceM: number) {
  const weight = hazards.reduce((n, h) => n + WEIGHT[h.severity], 0);
  const km = Math.max(0.1, distanceM / 1000);
  return { weight, perKm: weight / km };
}

export function worstOf(hazards: Hazard[]): Severity | null {
  if (!hazards.length) return null;
  return hazards.reduce((w, h) => (RANK[h.severity] > RANK[w] ? h.severity : w), 'good' as Severity);
}
