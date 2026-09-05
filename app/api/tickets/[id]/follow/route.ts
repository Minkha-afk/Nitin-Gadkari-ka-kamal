/** POST /api/tickets/{id}/follow — this device starts or stops watching it. */

import { NextRequest } from 'next/server';
import { deviceId } from '@/lib/device';
import { isConfigured, tickets } from '@/lib/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  const { id } = await ctx.params;
  const device = await deviceId();
  if (!device) return Response.json({ error: 'no device cookie' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const following = body?.following !== false;

  const col = await tickets();
  const res = await col.updateOne(
    { _id: id },
    following ? { $addToSet: { followers: device } } : { $pull: { followers: device } },
  );
  if (!res.matchedCount) return Response.json({ error: `no ticket ${id}` }, { status: 404 });
  return Response.json({ following });
}
