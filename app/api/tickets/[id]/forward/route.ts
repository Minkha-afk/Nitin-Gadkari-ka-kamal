/**
 * POST /api/tickets/{id}/forward — hand the ticket to the level above.
 * Body: { actor, note? }
 *
 * There is no deadline that does this on its own. Somebody decides the office
 * holding the ticket is not answering, signs the decision, and it climbs one
 * step — which is exactly what the audit chain then says happened.
 */

import { NextRequest } from 'next/server';
import { deviceId } from '@/lib/device';
import { isConfigured } from '@/lib/mongo';
import { forwardUp } from '@/lib/tickets';
import { toView } from '../../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  const { id } = await ctx.params;

  let body: { actor?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }
  if (!body.actor?.trim()) {
    return Response.json({ error: 'actor is required — who is forwarding this?' }, { status: 400 });
  }

  try {
    const ticket = await forwardUp(id, body.actor.trim(), { note: body.note ?? null });
    return Response.json({ ticket: toView(ticket, await deviceId()), level: ticket.level });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg }, { status: msg.startsWith('no ticket') ? 404 : 400 });
  }
}
