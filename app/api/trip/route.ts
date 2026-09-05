/**
 * POST /api/trip — "does my drive go over anything?"
 *
 * Geocode both ends, ask OSRM for the drive, then hand the line to the corridor
 * engine in lib/routing.ts and report what sits on it.
 */

import { NextRequest } from 'next/server';
import type { LatLng } from '@/lib/geo';
import { isConfigured } from '@/lib/mongo';
import {
  DEFAULT_CORRIDOR_M,
  driveRoutes,
  hazardsAlong,
  resolvePlace,
  worstOf,
  type Endpoint,
  type Hazard,
} from '@/lib/routing';
import type { Severity } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface TripResponse {
  source: Endpoint;
  destination: Endpoint;
  route: { distanceM: number; durationS: number; coordinates: LatLng[] };
  hazards: Hazard[];
  corridorM: number;
  /** Defects in the database near this corridor, for context. */
  scanned: number;
  worst: Severity | null;
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
    // Nominatim asks for ~1 request/second, so these go one after the other.
    const source = await resolvePlace(body.source, 'Source');
    const destination = await resolvePlace(body.destination, 'Destination');
    const [route] = await driveRoutes(source, destination);

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

    const payload: TripResponse = {
      source,
      destination,
      route,
      hazards,
      corridorM,
      scanned,
      worst: worstOf(hazards),
      warning,
    };
    return Response.json(payload);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
