/**
 * POST /api/maintenance/escalate — move unacknowledged overdue tickets up the
 * chain. Idempotent, so it is safe to run on a cron or by hand during a demo.
 */

import { isConfigured } from '@/lib/mongo';
import { escalateOverdue } from '@/lib/tickets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isConfigured()) return Response.json({ error: 'database not configured' }, { status: 503 });
  try {
    const moved = await escalateOverdue();
    return Response.json({ escalated: moved.length, moved });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
