/**
 * Turns an /analyze result into the documents we store.
 *
 * The API reports per frame, so one pothole a car drove past appears in a dozen
 * items. Track ids are stable across frames, so we collapse by track id and keep
 * the sighting the detector was most confident about — that is the frame worth
 * showing on the map. An image upload has no tracking, so each detection in it
 * becomes its own document.
 */

import type { AnalyzeResult } from './analyze';
import type { DefectDoc, UploadDoc } from './mongo';
import type { Severity } from './types';

const RANK: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };

export interface IngestMeta {
  fileName?: string | null;
  kind?: 'image' | 'video';
}

export function buildDocs(result: AnalyzeResult, meta: IngestMeta = {}) {
  const now = new Date();
  const capturedAt = result.processedAt ?? now.toISOString();
  const fileName = meta.fileName ?? null;
  const byId = new Map<string, DefectDoc>();

  for (const item of result.items) {
    item.detections.forEach((det, n) => {
      const id =
        det.trackId != null
          ? `${result.jobId}:t${det.trackId}`
          : `${result.jobId}:${item.frameNumber ?? 'img'}:${n}`;

      const existing = byId.get(id);
      if (existing) {
        existing.sightings += 1;
        // The worst view of a defect is the true one: a frame that read Severe
        // is not undone by a later blurrier frame that read Moderate.
        if (RANK[item.severity] > RANK[existing.severity]) {
          existing.severity = item.severity;
          existing.severityLabel = item.severityLabel;
        }
        // Otherwise keep the frame the detector was surest about — that is the
        // image worth showing on the map.
        if (det.confidence <= existing.confidence) return;
      }

      const severity = existing && RANK[existing.severity] > RANK[item.severity]
        ? existing.severity
        : item.severity;
      const severityLabel = severity === item.severity ? item.severityLabel : existing!.severityLabel;

      byId.set(id, {
        _id: id,
        jobId: result.jobId,
        trackId: det.trackId,
        damageClass: det.damageClass,
        severity,
        severityLabel,
        confidence: det.confidence,
        location: item.coordinates
          ? { type: 'Point', coordinates: [item.coordinates.lng, item.coordinates.lat] }
          : null,
        lat: item.coordinates?.lat ?? null,
        lng: item.coordinates?.lng ?? null,
        address: item.address ?? null,
        mapsUrl: item.mapsUrl ?? null,
        imageUrl: item.imageUrl,
        frameNumber: item.frameNumber,
        timestamp: item.timestamp,
        timeS: item.timeS,
        bbox: det.bbox,
        sightings: existing ? existing.sightings : 1,
        fileName,
        capturedAt,
        createdAt: now, // $setOnInsert keeps the original on re-ingest
        updatedAt: now,
      });
    });
  }

  const docs = [...byId.values()];

  const upload: UploadDoc = {
    _id: result.jobId,
    fileName,
    kind: result.type ?? meta.kind ?? 'image',
    status: result.status,
    reason: result.reason ?? null,
    summary: result.summary ?? null,
    defectCount: docs.length,
    locatedCount: docs.filter((d) => d.location).length,
    disclaimer: result.disclaimer ?? null,
    processedAt: result.processedAt ?? null,
    createdAt: now,
  };

  return { docs, upload };
}
