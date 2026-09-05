/**
 * GET  /api/tickets  — list, filtered
 * POST /api/tickets  — open one by hand from defect ids
 *
 * Filters: state, severity, authorityId, mine=1 (this device), breached=1,
 * following=1, limit.
 */

import { NextRequest } from 'next/server';
import { deviceId } from '@/lib/device';
import { defects, isConfigured, tickets, type TicketDoc } from '@/lib/mongo';
import { slaStanding } from '@/lib/sla';
import { ticketForDefect } from '@/lib/tickets';
import type { Severity, TicketState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface TicketView extends Omit<TicketDoc, 'slaAckDue' | 'slaFixDue' | 'createdAt' | 'updatedAt'> {
  slaAckDue: string;
  slaFixDue: string;
  createdAt: string;
  updatedAt: string;
  daysOver?: number;
  daysLeft?: number;
  breached: boolean;
  mine: boolean;
  following: boolean;
}

export function toView(t: TicketDoc, device: string | null): TicketView {
  const standing = slaStanding(t);
  return {
    ...t,
    slaAckDue: new Date(t.slaAckDue).toISOString(),
    slaFixDue: new Date(t.slaFixDue).toISOString(),
    createdAt: new Date(t.createdAt).toISOString(),
    updatedAt: new Date(t.updatedAt).toISOString(),
    acknowledgedAt: t.acknowledgedAt ? new Date(t.acknowledgedAt) : null,
    assignedAt: t.assignedAt ? new Date(t.assignedAt) : null,
    repairedAt: t.repairedAt ? new Date(t.repairedAt) : null,
    verifiedAt: t.verifiedAt ? new Date(t.verifiedAt) : null,
    closedAt: t.closedAt ? new Date(t.closedAt) : null,
    ...standing,
    mine: device ? t.reportedBy.includes(device) : false,
    following: device ? t.followers.includes(device) : false,
  };
}

export async function GET(req: NextRequest) {
  if (!isConfigured()) return Response.json({ tickets: [], total: 0, configured: false });

  const p = req.nextUrl.searchParams;
  const device = await deviceId();
  const filter: Record<string, unknown> = {};

  const state = p.get('state');
  if (state) filter.state = { $in: state.split(',') as TicketState[] };
  const severity = p.get('severity');
  if (severity) filter.severity = { $in: severity.split(',') as Severity[] };
  if (p.get('authorityId')) filter.authorityId = p.get('authorityId');
  if (p.get('mine') === '1') filter.reportedBy = device ?? '__none__';
  if (p.get('following') === '1') filter.followers = device ?? '__none__';
  if (p.get('breached') === '1') {
    filter.slaFixDue = { $lt: new Date() };
    filter.state = { $nin: ['repaired', 'verified', 'closed'] };
  }

  try {
    const col = await tickets();
    const limit = Math.min(500, Number(p.get('limit')) || 100);
    const [rows, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return Response.json({ tickets: rows.map((t) => toView(t, device)), total, configured: true });
  } catch (e) {
    return Response.json({ tickets: [], total: 0, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });

  let body: { defectIds?: string[]; actor?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }
  if (!body.defectIds?.length) {
    return Response.json({ error: 'defectIds is required' }, { status: 400 });
  }

  try {
    const device = await deviceId();
    const defectCol = await defects();
    const found = await defectCol.find({ _id: { $in: body.defectIds } }).toArray();
    if (!found.length) return Response.json({ error: 'no such defects' }, { status: 404 });

    const opened: string[] = [];
    for (const d of found) {
      const { ticket } = await ticketForDefect(d, body.actor ?? device ?? 'citizen');
      await defectCol.updateOne({ _id: d._id }, { $set: { ticketId: ticket._id } });
      if (!opened.includes(ticket._id)) opened.push(ticket._id);
    }
    return Response.json({ tickets: opened });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
