/**
 * GET  /api/authorities — who owns which road, with live open counts
 * POST /api/authorities — register one
 *
 * Nothing is seeded. An authority is a real organisation with a real
 * jurisdiction; inventing a ward office would be inventing data. Until one is
 * registered, tickets are created unassigned and say so.
 *
 * POST body: { id, name, level, parentId?, contact?, area? }
 * `area` is a GeoJSON Polygon — [lng, lat] rings, first point repeated last.
 */

import { NextRequest } from 'next/server';
import { authorities, isConfigured, tickets, type AuthorityDoc } from '@/lib/mongo';
import { ESCALATION } from '@/lib/sla';
import type { AuthorityLevel } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isConfigured()) return Response.json({ authorities: [], configured: false });
  try {
    const [col, ticketCol] = await Promise.all([authorities(), tickets()]);
    const rows = await col.find({}).sort({ level: 1, name: 1 }).toArray();
    const counts = await ticketCol
      .aggregate<{ _id: string | null; open: number }>([
        { $match: { state: { $nin: ['closed', 'verified'] } } },
        { $group: { _id: '$authorityId', open: { $sum: 1 } } },
      ])
      .toArray();
    const byId = new Map(counts.map((c) => [c._id, c.open]));
    return Response.json({
      authorities: rows.map((a) => ({ ...a, openCount: byId.get(a._id) ?? 0 })),
      unassignedOpen: byId.get(null) ?? 0,
      configured: true,
    });
  } catch (e) {
    return Response.json({ authorities: [], error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });

  let body: Partial<AuthorityDoc>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }
  if (!body._id || !body.name || !body.level) {
    return Response.json({ error: '_id, name and level are required' }, { status: 400 });
  }
  if (!ESCALATION.includes(body.level as AuthorityLevel) && body.level !== 'public') {
    return Response.json({ error: `level must be one of ${ESCALATION.join(', ')}` }, { status: 400 });
  }

  const doc: AuthorityDoc = {
    _id: body._id,
    name: body.name,
    level: body.level as AuthorityLevel,
    parentId: body.parentId ?? null,
    contact: body.contact ?? null,
    area: body.area ?? null,
    createdAt: new Date(),
  };

  try {
    const col = await authorities();
    await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
    return Response.json({ authority: doc });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
