/**
 * Everything the citizen home page knows, read straight from MongoDB.
 *
 * The page is a server component, so this runs in-process — no HTTP round trip
 * to our own API just to render our own page.
 *
 * It never throws. An unconfigured or unreachable database is a state the page
 * renders ("nothing reported yet"), not an error that blanks it.
 */

import { defects, isConfigured, uploads, type DefectDoc } from './mongo';
import type { DamageClass, Severity } from './types';

export interface RecentDefect {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  confidence: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  imageUrl: string;
  mapsUrl: string | null;
  sightings: number;
  fileName: string | null;
  createdAt: string;
}

export interface MapDefect {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  lat: number;
  lng: number;
  address: string | null;
  imageUrl: string;
}

export interface Overview {
  configured: boolean;
  error: string | null;
  totals: {
    defects: number;
    located: number;
    /** Raw frame sightings behind those defects. */
    sightings: number;
    uploads: number;
    /** Distinct streets, as far as reverse geocoding could name them. */
    roads: number;
  };
  bySeverity: { severity: Severity; count: number }[];
  byClass: { damageClass: DamageClass; count: number }[];
  recent: RecentDefect[];
  mapPoints: MapDefect[];
  lastReportAt: string | null;
}

const EMPTY: Overview = {
  configured: false,
  error: null,
  totals: { defects: 0, located: 0, sightings: 0, uploads: 0, roads: 0 },
  bySeverity: [],
  byClass: [],
  recent: [],
  mapPoints: [],
  lastReportAt: null,
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'good'];

export async function getOverview(): Promise<Overview> {
  if (!isConfigured()) return { ...EMPTY };

  try {
    const [defectCol, uploadCol] = await Promise.all([defects(), uploads()]);

    const [
      total,
      located,
      uploadCount,
      severityRows,
      classRows,
      sightingRows,
      roads,
      recentRows,
      mapRows,
      newest,
    ] = await Promise.all([
      defectCol.countDocuments({}),
      defectCol.countDocuments({ location: { $ne: null } }),
      uploadCol.countDocuments({}),
      defectCol.aggregate<{ _id: Severity; count: number }>([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]).toArray(),
      defectCol.aggregate<{ _id: DamageClass; count: number }>([
        { $group: { _id: '$damageClass', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      defectCol.aggregate<{ _id: null; total: number }>([
        { $group: { _id: null, total: { $sum: '$sightings' } } },
      ]).toArray(),
      defectCol.distinct('address', { address: { $ne: null } }),
      defectCol.find({}).sort({ createdAt: -1 }).limit(12).toArray(),
      defectCol.find({ location: { $ne: null } }).sort({ createdAt: -1 }).limit(500).toArray(),
      defectCol.find({}).sort({ createdAt: -1 }).limit(1).toArray(),
    ]);

    const severityMap = new Map(severityRows.map((r) => [r._id, r.count]));

    return {
      configured: true,
      error: null,
      totals: {
        defects: total,
        located,
        sightings: sightingRows[0]?.total ?? 0,
        uploads: uploadCount,
        roads: roads.length,
      },
      bySeverity: SEVERITY_ORDER.filter((s) => severityMap.get(s)).map((s) => ({
        severity: s,
        count: severityMap.get(s)!,
      })),
      byClass: classRows.map((r) => ({ damageClass: r._id, count: r.count })),
      recent: recentRows.map(toRecent),
      mapPoints: mapRows
        .filter((d) => d.lat != null && d.lng != null)
        .map((d) => ({
          id: d._id,
          damageClass: d.damageClass,
          severity: d.severity,
          severityLabel: d.severityLabel,
          lat: d.lat!,
          lng: d.lng!,
          address: d.address,
          imageUrl: d.imageUrl,
        })),
      lastReportAt: newest[0]?.createdAt ? new Date(newest[0].createdAt).toISOString() : null,
    };
  } catch (e) {
    return { ...EMPTY, configured: true, error: (e as Error).message };
  }
}

function toRecent(d: DefectDoc): RecentDefect {
  return {
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
    fileName: d.fileName,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

/* ── stretches ─────────────────────────────────────────────────────── */

export interface Stretch {
  address: string;
  count: number;
  worst: Severity;
  lat: number | null;
  lng: number | null;
  imageUrl: string;
  openTickets: number;
}

const RANK: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Reported damage grouped by street.
 *
 * The street name comes from reverse geocoding, so this only covers defects
 * that were geocoded — it is a view of what has been reported, never a survey
 * of the road network.
 */
export async function getStretches(limit = 10): Promise<Stretch[]> {
  if (!isConfigured()) return [];
  try {
    const col = await defects();
    const rows = await col
      .aggregate<{
        _id: string;
        count: number;
        severities: Severity[];
        lat: number | null;
        lng: number | null;
        imageUrl: string;
        tickets: (string | null)[];
      }>([
        { $match: { address: { $ne: null } } },
        {
          $group: {
            _id: '$address',
            count: { $sum: 1 },
            severities: { $push: '$severity' },
            lat: { $first: '$lat' },
            lng: { $first: '$lng' },
            imageUrl: { $first: '$imageUrl' },
            tickets: { $addToSet: '$ticketId' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ])
      .toArray();

    return rows
      .map((r) => ({
        address: r._id,
        count: r.count,
        worst: r.severities.reduce((w, s) => (RANK[s] > RANK[w] ? s : w), 'good' as Severity),
        lat: r.lat,
        lng: r.lng,
        imageUrl: r.imageUrl,
        openTickets: r.tickets.filter(Boolean).length,
      }))
      .sort((a, b) => RANK[b.worst] - RANK[a.worst] || b.count - a.count);
  } catch {
    return [];
  }
}
