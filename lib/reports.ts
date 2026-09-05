/**
 * "My reports" — everything this browser has sent in, and what happened to it.
 *
 * Scoped by the rs_device cookie (see middleware.ts). That identifies a device,
 * not a person: a different browser is a different history, and there is no way
 * to merge them until real accounts exist. The page says so.
 */

import { defects, isConfigured, tickets, uploads, type DefectDoc, type TicketDoc } from './mongo';
import { slaStanding } from './sla';
import type { DamageClass, Severity, TicketState } from './types';

export interface MyDefect {
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
  ticketId: string | null;
  createdAt: string;
}

export interface MyTicket {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  address: string | null;
  imageUrl: string;
  state: TicketState;
  level: string;
  authorityId: string | null;
  passes: number;
  daysOver?: number;
  daysLeft?: number;
  breached: boolean;
  createdAt: string;
  slaFixDue: string;
}

export interface MyReports {
  configured: boolean;
  device: string | null;
  totals: {
    uploads: number;
    defects: number;
    located: number;
    tickets: number;
    open: number;
    fixed: number;
    reopened: number;
    breached: number;
  };
  /** Median days from ticket opened to repaired, over tickets that got there. */
  medianFixDays: number | null;
  byClass: { damageClass: DamageClass; count: number }[];
  bySeverity: { severity: Severity; count: number }[];
  defects: MyDefect[];
  tickets: MyTicket[];
  following: MyTicket[];
}

const EMPTY: MyReports = {
  configured: false,
  device: null,
  totals: { uploads: 0, defects: 0, located: 0, tickets: 0, open: 0, fixed: 0, reopened: 0, breached: 0 },
  medianFixDays: null,
  byClass: [],
  bySeverity: [],
  defects: [],
  tickets: [],
  following: [],
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'good'];
const SETTLED: TicketState[] = ['repaired', 'verified', 'closed'];

export async function getMyReports(device: string | null): Promise<MyReports> {
  if (!isConfigured()) return { ...EMPTY };
  if (!device) return { ...EMPTY, configured: true };

  try {
    const [defectCol, uploadCol, ticketCol] = await Promise.all([defects(), uploads(), tickets()]);

    const [uploadCount, defectRows, mine, followed] = await Promise.all([
      uploadCol.countDocuments({ deviceId: device }),
      defectCol.find({ deviceId: device }).sort({ createdAt: -1 }).limit(200).toArray(),
      ticketCol.find({ reportedBy: device }).sort({ createdAt: -1 }).limit(100).toArray(),
      ticketCol
        .find({ followers: device, reportedBy: { $ne: device } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    ]);

    const byClass = new Map<DamageClass, number>();
    const bySeverity = new Map<Severity, number>();
    for (const d of defectRows) {
      byClass.set(d.damageClass, (byClass.get(d.damageClass) ?? 0) + 1);
      bySeverity.set(d.severity, (bySeverity.get(d.severity) ?? 0) + 1);
    }

    const fixDays = mine
      .filter((t) => t.repairedAt)
      .map((t) => (new Date(t.repairedAt!).getTime() - new Date(t.createdAt).getTime()) / 86_400_000)
      .sort((a, b) => a - b);

    return {
      configured: true,
      device,
      totals: {
        uploads: uploadCount,
        defects: defectRows.length,
        located: defectRows.filter((d) => d.location).length,
        tickets: mine.length,
        open: mine.filter((t) => !SETTLED.includes(t.state)).length,
        fixed: mine.filter((t) => SETTLED.includes(t.state)).length,
        reopened: mine.filter((t) => t.state === 'reopened').length,
        breached: mine.filter((t) => slaStanding(t).breached).length,
      },
      medianFixDays: fixDays.length ? Number(median(fixDays).toFixed(1)) : null,
      byClass: [...byClass.entries()]
        .map(([damageClass, count]) => ({ damageClass, count }))
        .sort((a, b) => b.count - a.count),
      bySeverity: SEVERITY_ORDER.filter((s) => bySeverity.get(s)).map((s) => ({
        severity: s,
        count: bySeverity.get(s)!,
      })),
      defects: defectRows.map(toMyDefect),
      tickets: mine.map(toMyTicket),
      following: followed.map(toMyTicket),
    };
  } catch {
    return { ...EMPTY, configured: true, device };
  }
}

function median(sorted: number[]) {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toMyDefect(d: DefectDoc): MyDefect {
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
    ticketId: d.ticketId,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

function toMyTicket(t: TicketDoc): MyTicket {
  const standing = slaStanding(t);
  return {
    id: t._id,
    damageClass: t.damageClass,
    severity: t.severity,
    severityLabel: t.severityLabel,
    address: t.address,
    imageUrl: t.imageUrl,
    state: t.state,
    level: t.level,
    authorityId: t.authorityId,
    passes: t.passes,
    ...standing,
    createdAt: new Date(t.createdAt).toISOString(),
    slaFixDue: new Date(t.slaFixDue).toISOString(),
  };
}
