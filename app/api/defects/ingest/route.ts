/**
 * POST /api/defects/ingest — persist one finished analysis.
 *
 * Called by the upload page as soon as a job reaches `done`. Idempotent: the
 * same job re-analysed overwrites its own documents rather than duplicating
 * them, because the _id is derived from the job and track id.
 */

import { NextRequest } from 'next/server';
import type { AnalyzeResult } from '@/lib/analyze';
import { buildDocs } from '@/lib/defects';
import { defects, isConfigured, uploads } from '@/lib/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return Response.json(
      { stored: 0, located: 0, skipped: 'database not configured — set MONGODB_URI in .env.local' },
      { status: 200 },
    );
  }

  let body: { result?: AnalyzeResult; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 });
  }

  const result = body.result;
  if (!result?.jobId || !Array.isArray(result.items)) {
    return Response.json({ error: 'body.result must be an /analyze response' }, { status: 400 });
  }

  const { docs, upload } = buildDocs(result, { fileName: body.fileName ?? null });

  try {
    const [defectCol, uploadCol] = await Promise.all([defects(), uploads()]);
    await uploadCol.replaceOne({ _id: upload._id }, upload, { upsert: true });

    if (docs.length) {
      await defectCol.bulkWrite(
        docs.map(({ createdAt, ...fields }) => ({
          updateOne: {
            filter: { _id: fields._id },
            // Re-analysing a clip refreshes the defect but keeps the date it
            // was first reported — that is what the SLA clock runs on.
            update: { $set: fields, $setOnInsert: { createdAt } },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    return Response.json({ stored: docs.length, located: upload.locatedCount, jobId: upload._id });
  } catch (e) {
    return Response.json({ error: `could not write to MongoDB: ${(e as Error).message}` }, { status: 500 });
  }
}
