/**
 * POST /api/routes/compare — the same two places, every way OSRM will drive it,
 * ranked by what the road surface is actually like.
 *
 * "Fastest" is whatever OSRM says. "Smoothest" is ours: the fewest and mildest
 * defects per kilometre. They are usually not the same route, and that choice —
 * four minutes against nine potholes — is the whole point of the page.
 */

import { NextRequest } from 'next/server';
import type { LatLng } from '@/lib/geo';
import { isConfigured } from '@/lib/mongo';
import {
  DEFAULT_CORRIDOR_M,
  driveRoutes,
  hazardsAlong,
  resolvePlace,
  roughness,
  worstOf,
  type Endpoint,
  type Hazard,
} from '@/lib/routing';
import type { Severity } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface RouteOption {
  id: string;
  distanceM: number;
  durationS: number;
  coordinates: LatLng[];
  hazards: Hazard[];
  worst: Severity | null;
  /** Severity-weighted damage per kilometre. Lower is smoother. */
  roughPerKm: number;
  labels: ('fastest' | 'smoothest' | 'shortest')[];
  /** Seconds and metres against the fastest option. */
  slowerByS: number;
  longerByM: number;
}

export interface CompareResponse {
  source: Endpoint;
  destination: Endpoint;
  options: RouteOption[];
  corridorM: number;
  warning?: string;
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
    const source = await resolvePlace(body.source, 'Source');
    const destination = await resolvePlace(body.destination, 'Destination');
    const routes = await driveRoutes(source, destination, true);

    let warning: string | undefined;
    if (!isConfigured()) {
      warning = 'MONGODB_URI is not set, so these routes were not checked against any reported damage.';
    }

    const options: RouteOption[] = [];
    for (const [i, r] of routes.entries()) {
      let hazards: Hazard[] = [];
      if (isConfigured()) {
        try {
          hazards = (await hazardsAlong(r.coordinates, corridorM)).hazards;
        } catch (e) {
          warning = `routes found, but the damage database could not be read: ${(e as Error).message}`;
        }
      }
      options.push({
        id: `route-${i}`,
        distanceM: r.distanceM,
        durationS: r.durationS,
        coordinates: r.coordinates,
        hazards,
        worst: worstOf(hazards),
        roughPerKm: Number(roughness(hazards, r.distanceM).perKm.toFixed(2)),
        labels: [],
        slowerByS: 0,
        longerByM: 0,
      });
    }

    const fastest = options.reduce((a, b) => (b.durationS < a.durationS ? b : a));
    const shortest = options.reduce((a, b) => (b.distanceM < a.distanceM ? b : a));
    // Ties on roughness go to the quicker route — no reason to send someone
    // the long way round for an identical surface.
    const smoothest = options.reduce((a, b) =>
      b.roughPerKm < a.roughPerKm || (b.roughPerKm === a.roughPerKm && b.durationS < a.durationS) ? b : a,
    );
    fastest.labels.push('fastest');
    shortest.labels.push('shortest');
    smoothest.labels.push('smoothest');

    for (const o of options) {
      o.slowerByS = Math.round(o.durationS - fastest.durationS);
      o.longerByM = Math.round(o.distanceM - fastest.distanceM);
    }
    options.sort((a, b) => a.roughPerKm - b.roughPerKm || a.durationS - b.durationS);

    const payload: CompareResponse = { source, destination, options, corridorM, warning };
    return Response.json(payload);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
