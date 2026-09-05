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
import { getAuthorityTree } from '@/lib/authority';
import { authorities, isConfigured, type AuthorityDoc } from '@/lib/mongo';
import { ESCALATION } from '@/lib/sla';
import type { AuthorityLevel } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isConfigured()) return Response.json({ authorities: [], configured: false });
  try {
    // Same rollup the sidebar uses: an authority's count includes everything
    // beneath it, so a zone and its wards never disagree about the number.
    const [tree, col] = await Promise.all([getAuthorityTree(), authorities()]);
    const docs = new Map((await col.find({}).toArray()).map((a) => [a._id, a]));
    return Response.json({
      authorities: tree.nodes.map((n) => ({ ...docs.get(n.id), ...n, openCount: n.openCount })),
      unassignedOpen: tree.unassignedOpen,
      totalOpen: tree.totalOpen,
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
