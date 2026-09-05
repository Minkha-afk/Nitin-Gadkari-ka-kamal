/**
 * Geometry for the route/pothole engine.
 *
 * Everything works in metres on an equirectangular approximation. Over a city
 * route the error is well under a metre, and the alternative — proper geodesics
 * for every defect against every route segment — costs far more than it buys
 * when the corridor we are testing against is 35 m wide.
 */

export type LatLng = { lat: number; lng: number };

const R = 6_371_000; // mean Earth radius, metres

export function haversine(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const dφ = φ2 - φ1;
  const dλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Local metres-per-degree at a given latitude. */
function scale(lat: number) {
  const rad = (lat * Math.PI) / 180;
  return { x: (Math.PI / 180) * R * Math.cos(rad), y: (Math.PI / 180) * R };
}

/**
 * Distance in metres from point p to segment a→b, plus how far along that
 * segment the closest point sits (0–1). The `t` is what lets us report
 * "1.4 km into your drive" rather than just "somewhere on the route".
 */
export function pointToSegment(p: LatLng, a: LatLng, b: LatLng): { dist: number; t: number } {
  const s = scale(p.lat);
  const px = (p.lng - a.lng) * s.x;
  const py = (p.lat - a.lat) * s.y;
  const bx = (b.lng - a.lng) * s.x;
  const by = (b.lat - a.lat) * s.y;
  const len2 = bx * bx + by * by;
  if (len2 === 0) return { dist: Math.hypot(px, py), t: 0 };
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  return { dist: Math.hypot(px - t * bx, py - t * by), t };
}

/**
 * Closest approach of a point to a polyline: distance in metres and how far
 * along the line (metres from its start) that happens.
 */
export function pointToPath(p: LatLng, path: LatLng[]): { dist: number; along: number } {
  let best = { dist: Infinity, along: 0 };
  let travelled = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const segLen = haversine(path[i], path[i + 1]);
    const { dist, t } = pointToSegment(p, path[i], path[i + 1]);
    if (dist < best.dist) best = { dist, along: travelled + t * segLen };
    travelled += segLen;
  }
  return best;
}

export function pathLength(path: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += haversine(path[i], path[i + 1]);
  return total;
}

/** Bounding box of a path, grown by `padMetres` on every side. */
export function bboxOf(path: LatLng[], padMetres = 0) {
  const lats = path.map((p) => p.lat);
  const lngs = path.map((p) => p.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const s = scale(midLat);
  return {
    minLat: Math.min(...lats) - padMetres / s.y,
    maxLat: Math.max(...lats) + padMetres / s.y,
    minLng: Math.min(...lngs) - padMetres / s.x,
    maxLng: Math.max(...lngs) + padMetres / s.x,
  };
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}
