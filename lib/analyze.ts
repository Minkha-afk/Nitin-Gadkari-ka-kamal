/**
 * Client for the Road Damage Detection API, typed against lib/types.ts.
 *
 * Calls go to /api/ml (see app/api/ml/[...path]/route.ts), which attaches the
 * API key server-side. An image comes back finished; a video comes back as a
 * jobId that has to be polled — analyzeAndWait() hides that split.
 */

import type { DamageClass, Severity } from './types';

export const ML_PROXY = '/api/ml';

export type AnalyzeStatus = 'queued' | 'processing' | 'done' | 'failed' | 'rejected';

export interface AnalyzeDetection {
  damageClass: DamageClass;
  confidence: number;
  /** [x1, y1, x2, y2] in the pixel space of imageUrl. */
  bbox: [number, number, number, number];
  /** Stable across frames — one physical defect keeps one id. */
  trackId: number | null;
}

export interface AnalyzeItem {
  id: string;
  imageUrl: string;
  frameNumber: number | null;
  timestamp: string | null;
  timeS: number | null;
  severity: Severity;
  /** The model's own wording, e.g. "Severe". */
  severityLabel: string;
  confidence: number;
  detectionCount: number;
  /** Note lng, not lon. */
  coordinates: { lat: number; lng: number } | null;
  address: string | null;
  mapsUrl: string | null;
  detections: AnalyzeDetection[];
}

export interface AnalyzeSummary {
  itemCount: number;
  /** Physical defects after tracking — report this one, not totalDetections. */
  uniquePotholes: number | null;
  totalDetections: number | null;
  overallSeverity: Severity;
  durationS: number | null;
  framesAnalysed: number | null;
  framesWithDamage: number | null;
  gpsSource: 'frame-overlay-ocr' | 'gps-log' | null;
  locatedCount: number;
  addressedCount: number;
}

export interface AnalyzeGate {
  valid: boolean;
  reason?: string;
  road_probability?: number;
  blur_score?: number;
}

export interface AnalyzeResult {
  jobId: string;
  status: AnalyzeStatus;
  type?: 'image' | 'video';
  processedAt?: string;
  summary: AnalyzeSummary | null;
  items: AnalyzeItem[];
  disclaimer?: string;
  /** Present when status is 'rejected'. */
  reason?: string;
  gate?: AnalyzeGate;
  /** Present when status is 'failed'. */
  error?: string;
  poll?: string;
}

export interface AnalyzeOptions {
  /** Detection threshold. Lower finds more, with more false positives. */
  conf?: number;
  /** Frames per second reported. Tracking always runs at 12 fps internally. */
  sampleFps?: number;
  /** OCR the lat/long the camera burns into the frame. */
  readGpsFromFrame?: boolean;
  /** Street address per coordinate. The only call that leaves the machine, ~1 s each. */
  reverseGeocode?: boolean;
  signal?: AbortSignal;
  onUploadProgress?: (fraction: number) => void;
}

export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'bmp', 'webp'];
export const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
export const ACCEPT = [...IMAGE_EXTS, ...VIDEO_EXTS].map((e) => `.${e}`).join(',');

export function fileKind(file: File): 'image' | 'video' | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  return null;
}

/**
 * POST the file. Uses XHR rather than fetch because a 200 MB video upload
 * deserves a progress bar, and fetch still has no upload progress event.
 */
export function analyze(file: File, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('conf', String(opts.conf ?? 0.35));
  form.append('sample_fps', String(opts.sampleFps ?? 2));
  form.append('read_gps_from_frame', String(opts.readGpsFromFrame ?? true));
  form.append('reverse_geocode', String(opts.reverseGeocode ?? false));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ML_PROXY}/analyze`);
    xhr.responseType = 'text';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onUploadProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new Error('upload failed — is the detection service running?'));
    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error(`detection service returned ${xhr.status} (not JSON)`));
        return;
      }
      if (xhr.status >= 400) {
        const detail = (body as { detail?: string; error?: string }).detail
          ?? (body as { error?: string }).error
          ?? `request failed (${xhr.status})`;
        reject(new Error(detail));
        return;
      }
      resolve(body as AnalyzeResult);
    };

    if (opts.signal) {
      if (opts.signal.aborted) {
        reject(new DOMException('aborted', 'AbortError'));
        return;
      }
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'));
    }

    xhr.send(form);
  });
}

/** Poll a video job once. */
export async function pollAnalyze(jobId: string, signal?: AbortSignal): Promise<AnalyzeResult> {
  const res = await fetch(`${ML_PROXY}/analyze/${jobId}`, { signal, cache: 'no-store' });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.detail ?? `poll failed (${res.status})`);
  return body as AnalyzeResult;
}

export function isSettled(r: AnalyzeResult) {
  return r.status === 'done' || r.status === 'failed' || r.status === 'rejected';
}

export interface WaitOptions extends AnalyzeOptions {
  /** Called on every state change and every poll, with elapsed time. */
  onProgress?: (status: AnalyzeStatus, elapsedMs: number) => void;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

/** Submit, then poll to completion if it was a video. */
export async function analyzeAndWait(file: File, opts: WaitOptions = {}): Promise<AnalyzeResult> {
  const started = Date.now();
  const interval = opts.pollIntervalMs ?? 1500;
  const timeout = opts.timeoutMs ?? 15 * 60_000;

  let result = await analyze(file, opts);
  opts.onProgress?.(result.status, Date.now() - started);

  while (!isSettled(result)) {
    if (Date.now() - started > timeout) throw new Error('analysis timed out');
    await new Promise((r) => setTimeout(r, interval));
    if (opts.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    result = await pollAnalyze(result.jobId, opts.signal);
    opts.onProgress?.(result.status, Date.now() - started);
  }
  return result;
}

/** Items that carry coordinates — the ones that can go on a map. */
export function locatedItems(r: AnalyzeResult) {
  return r.items.filter((i) => i.coordinates != null);
}

export async function fetchGeoJson(jobId: string, signal?: AbortSignal) {
  const res = await fetch(`${ML_PROXY}/jobs/${jobId}/geojson`, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`geojson unavailable (${res.status})`);
  return res.json();
}

export async function health(): Promise<Record<string, unknown>> {
  const res = await fetch(`${ML_PROXY}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`health check failed (${res.status})`);
  return res.json();
}
