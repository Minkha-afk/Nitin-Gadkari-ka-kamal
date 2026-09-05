/** GET /api/tickets/{id} — the ticket, its defects, and its audit chain. */

import { NextRequest } from 'next/server';
import { deviceId } from '@/lib/device';
import { defects, isConfigured, ticketEvents, tickets } from '@/lib/mongo';
import { allowedActions, verifyChain } from '@/lib/tickets';
import { toView } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  const { id } = await ctx.params;

  try {
    const [ticketCol, eventCol, defectCol] = await Promise.all([tickets(), ticketEvents(), defects()]);
    const ticket = await ticketCol.findOne({ _id: id });
    if (!ticket) return Response.json({ error: `no ticket ${id}` }, { status: 404 });

    const [events, evidence, chain] = await Promise.all([
      eventCol.find({ ticketId: id }).sort({ seq: 1 }).toArray(),
      defectCol.find({ _id: { $in: ticket.defectIds } }).toArray(),
      verifyChain(id),
    ]);

    return Response.json({
      ticket: toView(ticket, await deviceId()),
      events,
      evidence,
      chain,
      actions: allowedActions(ticket.state),
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
