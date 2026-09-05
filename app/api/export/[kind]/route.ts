/**
 * GET /api/export/{kind}.csv — the database as a spreadsheet.
 *
 *   tickets  — work and where it stands, scoped to the current jurisdiction
 *   defects  — every stored detection
 *   events   — the audit trail, hashes included, so a chain can be re-verified
 *              outside this app
 *   uploads  — one row per analysed file, rejections included
 *
 * Tickets follow the authority scope cookie, the same as every console screen,
 * so an export matches what was on screen when it was asked for. `?scope=all`
 * overrides that.
 *
 * `?mine=1` is the citizen side of the same endpoint: it narrows tickets and
 * detections to the browser that sent them, using the device cookie. Someone
 * downloading their own evidence gets the identical columns an engineer sees,
 * which is the point — it is the same record, not a summary of it.
 */

import { NextRequest } from 'next/server';
import { scopeFilter, selectedScope } from '@/lib/authority';
import { deviceId } from '@/lib/device';
import { BOM, csvFilename, toCsv, type Column } from '@/lib/csv';
import {
  defects,
  isConfigured,
  ticketEvents,
  tickets,
  uploads,
  type DefectDoc,
  type TicketDoc,
  type TicketEventDoc,
  type UploadDoc,
} from '@/lib/mongo';
import { ticketStanding } from '@/lib/standing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TICKET_COLUMNS: Column<TicketDoc>[] = [
  { key: 'ticket_id', get: (t) => t._id },
  { key: 'state', get: (t) => t.state },
  { key: 'severity', get: (t) => t.severity },
  { key: 'severity_label', get: (t) => t.severityLabel },
  { key: 'damage_class', get: (t) => t.damageClass },
  { key: 'confidence', get: (t) => t.confidence },
  { key: 'passes', get: (t) => t.passes },
  { key: 'address', get: (t) => t.address },
  { key: 'latitude', get: (t) => t.lat },
  { key: 'longitude', get: (t) => t.lng },
  { key: 'authority_id', get: (t) => t.authorityId },
  { key: 'sitting_with', get: (t) => t.level },
  { key: 'contractor_id', get: (t) => t.contractorId },
  { key: 'forwarded_up_count', get: (t) => t.escalationCount ?? 0 },
  { key: 'last_forwarded_at', get: (t) => t.lastEscalatedAt },
  { key: 'opened_at', get: (t) => t.createdAt },
  { key: 'age_open', get: (t) => ticketStanding(t).ageLabel },
  { key: 'acknowledged_at', get: (t) => t.acknowledgedAt },
  { key: 'assigned_at', get: (t) => t.assignedAt },
  { key: 'repaired_at', get: (t) => t.repairedAt },
  { key: 'verified_at', get: (t) => t.verifiedAt },
  { key: 'closed_at', get: (t) => t.closedAt },
  { key: 'severity_history', get: (t) => (t.severityHistory ?? []).map((h) => h.severity) },
  { key: 'defect_ids', get: (t) => t.defectIds },
  { key: 'image_url', get: (t) => t.imageUrl },
  { key: 'maps_url', get: (t) => t.mapsUrl },
];

const DEFECT_COLUMNS: Column<DefectDoc>[] = [
  { key: 'defect_id', get: (d) => d._id },
  { key: 'job_id', get: (d) => d.jobId },
  { key: 'track_id', get: (d) => d.trackId },
  { key: 'damage_class', get: (d) => d.damageClass },
  { key: 'severity', get: (d) => d.severity },
  { key: 'severity_label', get: (d) => d.severityLabel },
  { key: 'confidence', get: (d) => d.confidence },
  { key: 'sightings', get: (d) => d.sightings },
  { key: 'latitude', get: (d) => d.lat },
  { key: 'longitude', get: (d) => d.lng },
  { key: 'address', get: (d) => d.address },
  { key: 'frame_number', get: (d) => d.frameNumber },
  { key: 'timestamp', get: (d) => d.timestamp },
  { key: 'bbox_x1', get: (d) => d.bbox?.[0] },
  { key: 'bbox_y1', get: (d) => d.bbox?.[1] },
  { key: 'bbox_x2', get: (d) => d.bbox?.[2] },
  { key: 'bbox_y2', get: (d) => d.bbox?.[3] },
  { key: 'ticket_id', get: (d) => d.ticketId },
  { key: 'file_name', get: (d) => d.fileName },
  { key: 'device_id', get: (d) => d.deviceId },
  { key: 'captured_at', get: (d) => d.capturedAt },
  { key: 'stored_at', get: (d) => d.createdAt },
  { key: 'image_url', get: (d) => d.imageUrl },
  { key: 'maps_url', get: (d) => d.mapsUrl },
];

const EVENT_COLUMNS: Column<TicketEventDoc>[] = [
  { key: 'ticket_id', get: (e) => e.ticketId },
  { key: 'seq', get: (e) => e.seq },
  { key: 'action', get: (e) => e.action },
  { key: 'actor', get: (e) => e.actor },
  { key: 'note', get: (e) => e.note },
  { key: 'at', get: (e) => e.at },
  { key: 'tone', get: (e) => e.tone },
  { key: 'hash', get: (e) => e.hash },
  { key: 'prev_hash', get: (e) => e.prevHash },
];

const UPLOAD_COLUMNS: Column<UploadDoc>[] = [
  { key: 'job_id', get: (u) => u._id },
  { key: 'file_name', get: (u) => u.fileName },
  { key: 'kind', get: (u) => u.kind },
  { key: 'status', get: (u) => u.status },
  { key: 'reason', get: (u) => u.reason },
  { key: 'defects_found', get: (u) => u.defectCount },
  { key: 'defects_located', get: (u) => u.locatedCount },
  { key: 'device_id', get: (u) => u.deviceId },
  { key: 'processed_at', get: (u) => u.processedAt },
  { key: 'stored_at', get: (u) => u.createdAt },
];

const LIMIT = 20_000;

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  if (!isConfigured()) {
    return new Response('database not configured', { status: 503 });
  }

  // The route is linked as /api/export/tickets.csv so the browser saves it with
  // a sensible name even if the header is ignored.
  const kind = (await ctx.params).kind.replace(/\.csv$/, '');
  const mine = req.nextUrl.searchParams.get('mine') === '1';

  try {
    let csv: string;
    let suffix: string | undefined;

    switch (kind) {
      case 'tickets': {
        let filter: Record<string, unknown>;
        if (mine) {
          const device = await deviceId();
          filter = { reportedBy: device ?? '__none__' };
          suffix = 'mine';
        } else {
          const scope = req.nextUrl.searchParams.get('scope') === 'all' ? null : await selectedScope();
          filter = await scopeFilter(scope);
          suffix = scope ?? 'all';
        }
        const rows = await (await tickets()).find(filter).sort({ createdAt: -1 }).limit(LIMIT).toArray();
        csv = toCsv(TICKET_COLUMNS, rows);
        break;
      }
      case 'defects': {
        let filter: Record<string, unknown> = {};
        if (mine) {
          const device = await deviceId();
          filter = { deviceId: device ?? '__none__' };
          suffix = 'mine';
        }
        const rows = await (await defects()).find(filter).sort({ createdAt: -1 }).limit(LIMIT).toArray();
        csv = toCsv(DEFECT_COLUMNS, rows);
        break;
      }
      case 'events': {
        const rows = await (await ticketEvents())
          .find({})
          .sort({ ticketId: 1, seq: 1 })
          .limit(LIMIT)
          .toArray();
        csv = toCsv(EVENT_COLUMNS, rows);
        break;
      }
      case 'uploads': {
        const rows = await (await uploads()).find({}).sort({ createdAt: -1 }).limit(LIMIT).toArray();
        csv = toCsv(UPLOAD_COLUMNS, rows);
        break;
      }
      default:
        return new Response(`unknown export "${kind}" — try tickets, defects, events or uploads`, {
          status: 404,
        });
    }

    return new Response(BOM + csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${csvFilename(kind, suffix)}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(`export failed: ${(e as Error).message}`, { status: 500 });
  }
}
