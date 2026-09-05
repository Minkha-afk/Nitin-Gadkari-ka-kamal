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
import { deviceId } from '@/lib/device';
import { defects, isConfigured, uploads } from '@/lib/mongo';
import { shouldAutoTicket, ticketForDefect } from '@/lib/tickets';

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

  const { docs, upload } = buildDocs(result, {
    fileName: body.fileName ?? null,
    deviceId: await deviceId(),
  });

  try {
    const [defectCol, uploadCol] = await Promise.all([defects(), uploads()]);
    await uploadCol.replaceOne({ _id: upload._id }, upload, { upsert: true });

    if (docs.length) {
      await defectCol.bulkWrite(
        docs.map(({ createdAt, ...fields }) => ({
          updateOne: {
            filter: { _id: fields._id },
            // Re-analysing a clip refreshes the defect but keeps the date it
            // was first reported — that is how long it has been on record.
            update: { $set: fields, $setOnInsert: { createdAt } },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    // Severe damage opens a ticket with the responsible authority immediately,
    // with no waiting period. Anything milder is stored and stays available to
    // report by hand.
    const opened: string[] = [];
    const updated: string[] = [];
    for (const doc of docs) {
      if (!shouldAutoTicket(doc.severity)) continue;
      try {
        const { ticket, created } = await ticketForDefect(doc);
        await defectCol.updateOne({ _id: doc._id }, { $set: { ticketId: ticket._id } });
        (created ? opened : updated).push(ticket._id);
      } catch (e) {
        // A ticketing failure must not lose the detection itself.
        console.error(`ticket for ${doc._id} failed:`, (e as Error).message);
      }
    }

    return Response.json({
      stored: docs.length,
      located: upload.locatedCount,
      jobId: upload._id,
      ticketsOpened: opened,
      ticketsUpdated: updated,
    });
  } catch (e) {
    return Response.json({ error: `could not write to MongoDB: ${(e as Error).message}` }, { status: 500 });
  }
}
