/**
 * Column definitions for every export, in one place so the browser export of a
 * fresh analysis and the server export of stored data describe the same thing
 * with the same headers.
 */

import type { Column } from './csv';
import type { AnalyzeItem, AnalyzeResult } from './analyze';

/** One row per detection, with its frame's context repeated. */
export interface DetectionRow {
  item: AnalyzeItem;
  detectionIndex: number;
  result: AnalyzeResult;
}

export const DETECTION_COLUMNS: Column<DetectionRow>[] = [
  { key: 'job_id', get: (r) => r.result.jobId },
  { key: 'source_type', get: (r) => r.result.type ?? '' },
  { key: 'frame_number', get: (r) => r.item.frameNumber },
  { key: 'timestamp', get: (r) => r.item.timestamp },
  { key: 'time_s', get: (r) => r.item.timeS },
  { key: 'damage_class', get: (r) => r.item.detections[r.detectionIndex]?.damageClass },
  { key: 'detection_confidence', get: (r) => r.item.detections[r.detectionIndex]?.confidence },
  { key: 'track_id', get: (r) => r.item.detections[r.detectionIndex]?.trackId },
  { key: 'bbox_x1', get: (r) => r.item.detections[r.detectionIndex]?.bbox?.[0] },
  { key: 'bbox_y1', get: (r) => r.item.detections[r.detectionIndex]?.bbox?.[1] },
  { key: 'bbox_x2', get: (r) => r.item.detections[r.detectionIndex]?.bbox?.[2] },
  { key: 'bbox_y2', get: (r) => r.item.detections[r.detectionIndex]?.bbox?.[3] },
  { key: 'frame_severity', get: (r) => r.item.severity },
  { key: 'frame_severity_label', get: (r) => r.item.severityLabel },
  { key: 'frame_confidence', get: (r) => r.item.confidence },
  { key: 'detections_in_frame', get: (r) => r.item.detectionCount },
  { key: 'latitude', get: (r) => r.item.coordinates?.lat ?? '' },
  { key: 'longitude', get: (r) => r.item.coordinates?.lng ?? '' },
  { key: 'address', get: (r) => r.item.address ?? '' },
  { key: 'maps_url', get: (r) => r.item.mapsUrl ?? '' },
  { key: 'image_url', get: (r) => r.item.imageUrl },
  { key: 'processed_at', get: (r) => r.result.processedAt ?? '' },
];

/** Flatten an analysis into one row per detection. Frames with none are kept. */
export function detectionRows(result: AnalyzeResult): DetectionRow[] {
  const rows: DetectionRow[] = [];
  for (const item of result.items) {
    if (!item.detections.length) {
      rows.push({ item, detectionIndex: -1, result });
      continue;
    }
    item.detections.forEach((_, i) => rows.push({ item, detectionIndex: i, result }));
  }
  return rows;
}
