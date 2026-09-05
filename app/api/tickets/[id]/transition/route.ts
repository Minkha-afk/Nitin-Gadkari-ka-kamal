/**
 * POST /api/tickets/{id}/transition — move a ticket along.
 * Body: { action, actor, note?, contractorId? }
 *
 * Illegal transitions are refused rather than recorded, so the ticket's hash
 * chain only ever holds changes that actually happened.
 */

import { NextRequest } from 'next/server';
import { isConfigured } from '@/lib/mongo';
import { transition, type TicketAction } from '@/lib/tickets';
import { deviceId } from '@/lib/device';
import { toView } from '../../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  const { id } = await ctx.params;

  let body: { action?: TicketAction; actor?: string; note?: string; contractorId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }
  if (!body.action) return Response.json({ error: 'action is required' }, { status: 400 });
  if (!body.actor) return Response.json({ error: 'actor is required — who is doing this?' }, { status: 400 });

  try {
    const ticket = await transition(id, body.action, body.actor, {
      note: body.note ?? null,
      contractorId: body.contractorId ?? null,
    });
    return Response.json({ ticket: toView(ticket, await deviceId()) });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg }, { status: msg.startsWith('no ticket') ? 404 : 400 });
  }
}
