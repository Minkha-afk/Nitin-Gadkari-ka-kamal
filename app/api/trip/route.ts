/**
 * POST /api/trip — "does my drive go over anything?"
 *
 *   source/destination (a place name, or {lat,lng})
 *     → Nominatim geocode
 *     → OSRM driving route (free, no key)
 *     → every stored defect within `corridorM` of the route line
 *
 * The match is two-stage on purpose. Mongo narrows to the route's bounding box
 * using the 2dsphere index — cheap, but a box around a diagonal route contains
 * a lot of city the route never touches. The exact point-to-polyline distance
 * then runs in JS over that shortlist, which is what makes "35 m from the road
 * you are actually driving" mean something.
 */

import { NextRequest } from 'next/server';
import { bboxOf, pathLength, pointToPath, type LatLng } from '@/lib/geo';
import { defects, isConfigured, type DefectDoc } from '@/lib/mongo';
import type { DamageClass, Severity } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA = 'RoadSense/0.1 (road damage reporting)';
const OSRM = (process.env.OSRM_BASE ?? 'https://router.project-osrm.org').replace(/\/+$/, '');
const DEFAULT_CORRIDOR_M = 35;

export interface Endpoint extends LatLng {
  label: string;
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
  /** Metres from the route line — how squarely it sits in your path. */
  offsetM: number;
  /** Metres from the start of the route — where you will meet it. */
  alongM: number;
}

export interface TripResponse {
  source: Endpoint;
  destination: Endpoint;
  route: { distanceM: number; durationS: number; coordinates: LatLng[] };
  hazards: Hazard[];
  corridorM: number;
  /** Defects in the database carrying coordinates, for context. */
  scanned: number;
  worst: Severity | null;
  warning?: string;
}

async function resolve(input: unknown, which: string): Promise<Endpoint> {
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

async function drive(a: Endpoint, b: Endpoint) {
  const url =
    `${OSRM}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`routing service returned ${res.status}`);
  const body = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  if (body.code !== 'Ok' || !body.routes?.length) {
    throw new Error('no drivable route between those two places');
  }
  const r = body.routes[0];
  // OSRM speaks GeoJSON, so [lon, lat]. Flipping this is the classic bug.
  const coordinates: LatLng[] = r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  return { distanceM: r.distance, durationS: r.duration, coordinates };
}

const RANK: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };

async function hazardsAlong(path: LatLng[], corridorM: number) {
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
  const near = await col
    .find({ location: { $geoWithin: { $geometry: polygon } } })
    .limit(5000)
    .toArray();

  const hazards: Hazard[] = [];
  for (const d of near as DefectDoc[]) {
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
      offsetM: Math.round(dist),
      alongM: Math.round(along),
    });
  }
  hazards.sort((x, y) => x.alongM - y.alongM);
  return { hazards, scanned: near.length };
}

export async function POST(req: NextRequest) {
  let body: { source?: unknown; destination?: unknown; corridorM?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }

  const corridorM = Math.max(5, Math.min(500, Number(body.corridorM) || DEFAULT_CORRIDOR_M));

  try {
    // Nominatim asks for ~1 request/second, so these go one after the other.
    const source = await resolve(body.source, 'Source');
    const destination = await resolve(body.destination, 'Destination');
    const route = await drive(source, destination);

    let hazards: Hazard[] = [];
    let scanned = 0;
    let warning: string | undefined;

    if (!isConfigured()) {
      warning = 'MONGODB_URI is not set, so no stored damage could be checked against this route.';
    } else {
      try {
        const found = await hazardsAlong(route.coordinates, corridorM);
        hazards = found.hazards;
        scanned = found.scanned;
      } catch (e) {
        warning = `route found, but the damage database could not be read: ${(e as Error).message}`;
      }
    }

    const worst =
      hazards.length === 0
        ? null
        : hazards.reduce((w, h) => (RANK[h.severity] > RANK[w] ? h.severity : w), 'good' as Severity);

    const payload: TripResponse = {
      source,
      destination,
      route: { ...route, distanceM: route.distanceM || pathLength(route.coordinates) },
      hazards,
      corridorM,
      scanned,
      worst,
      warning,
    };
    return Response.json(payload);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
