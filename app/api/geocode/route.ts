/**
 * GET /api/geocode?q=… — place lookup for the source/destination fields.
 *
 * OpenStreetMap's Nominatim: free, no key, but rate-limited to ~1 request per
 * second and it requires a real User-Agent. Kept server-side so the identifying
 * header is actually sent and the browser never talks to them directly.
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA = 'RoadSense/0.1 (road damage reporting)';

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 3) return Response.json({ places: [] });

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '0');
  const cc = process.env.GEOCODE_COUNTRY ?? 'in';
  if (cc) url.searchParams.set('countrycodes', cc);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, accept: 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return Response.json({ places: [], error: `geocoder returned ${res.status}` });
    const raw = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    const places: Place[] = raw.map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
    return Response.json({ places });
  } catch (e) {
    return Response.json({ places: [], error: (e as Error).message });
  }
}
