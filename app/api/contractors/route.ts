/** GET/POST /api/contractors — the panel a ticket can be assigned to. */

import { NextRequest } from 'next/server';
import { contractors, isConfigured, tickets, type ContractorDoc } from '@/lib/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isConfigured()) return Response.json({ contractors: [], configured: false });
  try {
    const [col, ticketCol] = await Promise.all([contractors(), tickets()]);
    const rows = await col.find({}).sort({ name: 1 }).toArray();
    const load = await ticketCol
      .aggregate<{ _id: string; open: number }>([
        { $match: { contractorId: { $ne: null }, state: { $in: ['assigned', 'repaired'] } } },
        { $group: { _id: '$contractorId', open: { $sum: 1 } } },
      ])
      .toArray();
    const byId = new Map(load.map((c) => [c._id, c.open]));
    return Response.json({
      contractors: rows.map((c) => ({ ...c, openLoad: byId.get(c._id) ?? 0 })),
      configured: true,
    });
  } catch (e) {
    return Response.json({ contractors: [], error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Partial<ContractorDoc> | null;
  if (!body?._id || !body.name) {
    return Response.json({ error: '_id and name are required' }, { status: 400 });
  }
  const doc: ContractorDoc = {
    _id: body._id,
    name: body.name,
    panel: body.panel ?? null,
    ratePerM2: body.ratePerM2 ?? null,
    since: body.since ?? null,
    createdAt: new Date(),
  };
  const col = await contractors();
  await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
  return Response.json({ contractor: doc });
}
