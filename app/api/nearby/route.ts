/**
 * GET /api/nearby?lat=&lng=&radiusM= — reported damage around a point.
 *
 * Used by the drive screen, which polls it as the vehicle moves. Uses the
 * 2dsphere index directly: $near returns results already sorted by distance,
 * which is exactly the order a driver needs them in.
 */

import { NextRequest } from 'next/server';
import { defects, isConfigured } from '@/lib/mongo';
import { haversine } from '@/lib/geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isConfigured()) return Response.json({ defects: [], configured: false });

  const p = req.nextUrl.searchParams;
  const lat = Number(p.get('lat'));
  const lng = Number(p.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 });
  }
  const radiusM = Math.max(50, Math.min(20_000, Number(p.get('radiusM')) || 2000));

  try {
    const col = await defects();
    const rows = await col
      .find({
        location: {
          $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusM },
        },
      })
      .limit(100)
      .toArray();

    return Response.json({
      configured: true,
      defects: rows.map((d) => ({
        id: d._id,
        damageClass: d.damageClass,
        severity: d.severity,
        severityLabel: d.severityLabel,
        confidence: d.confidence,
        lat: d.lat,
        lng: d.lng,
        address: d.address,
        imageUrl: d.imageUrl,
        ticketId: d.ticketId ?? null,
        distanceM: d.lat != null && d.lng != null ? Math.round(haversine({ lat, lng }, { lat: d.lat, lng: d.lng })) : null,
      })),
    });
  } catch (e) {
    return Response.json({ defects: [], error: (e as Error).message }, { status: 500 });
  }
}
