/**
 * GET /api/defects — stored defects, newest first.
 * `?located=1` restricts to the ones that can go on a map.
 */

import { NextRequest } from 'next/server';
import { defects, isConfigured } from '@/lib/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isConfigured()) return Response.json({ defects: [], total: 0, configured: false });

  const limit = Math.min(2000, Number(req.nextUrl.searchParams.get('limit')) || 500);
  const onlyLocated = req.nextUrl.searchParams.get('located') === '1';

  try {
    const col = await defects();
    const filter = onlyLocated ? { location: { $ne: null } } : {};
    const [rows, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return Response.json({ defects: rows, total, configured: true });
  } catch (e) {
    return Response.json({ defects: [], total: 0, configured: true, error: (e as Error).message }, { status: 500 });
  }
}
