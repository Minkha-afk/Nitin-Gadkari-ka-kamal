'use client';

import React from 'react';
import { Bar, Btn, Chip, Inset, Panel, PanelBody, PanelHead } from '@/components/system';
import { IconCheck, IconCloud, IconMap, IconUp } from '@/components/chrome/Icons';
import {
  ACCEPT,
  analyzeAndWait,
  fileKind,
  health,
  type AnalyzeItem,
  type AnalyzeResult,
  type AnalyzeStatus,
} from '@/lib/analyze';
import { CLASS_LABEL } from '@/lib/types';
import { color, severityTone, toneColor } from '@/lib/tokens';

/* ── phases ──────────────────────────────────────────────────────────
   uploading → the file is still going over the wire (XHR progress)
   analysing → the server has it; a video is being polled              */
type Phase = 'idle' | 'uploading' | 'analysing' | 'done' | 'error';

const STATUS_TEXT: Record<AnalyzeStatus, string> = {
  queued: 'Queued behind another clip',
  processing: 'Walking the frames',
  done: 'Done',
  failed: 'Failed',
  rejected: 'Rejected',
};

function secs(ms: number) {
  return `${(ms / 1000).toFixed(0)}s`;
}

function bytes(n: number) {
  return n > 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;
}

export default function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [uploaded, setUploaded] = React.useState(0);
  const [status, setStatus] = React.useState<AnalyzeStatus>('queued');
  const [elapsed, setElapsed] = React.useState(0);
  const [result, setResult] = React.useState<AnalyzeResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [service, setService] = React.useState<'checking' | 'up' | 'down'>('checking');
  const [gpu, setGpu] = React.useState<string | null>(null);

  const [conf, setConf] = React.useState(0.35);
  const [geocode, setGeocode] = React.useState(true);
  const [readGps, setReadGps] = React.useState(true);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const busy = phase === 'uploading' || phase === 'analysing';
  const kind = file ? fileKind(file) : null;

  React.useEffect(() => {
    let live = true;
    health()
      .then((h) => {
        if (!live) return;
        setService('up');
        setGpu(h.cuda ? String(h.gpu ?? 'GPU') : 'CPU — slower');
      })
      .catch(() => live && setService('down'));
    return () => {
      live = false;
    };
  }, []);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | null | undefined) {
    if (!f) return;
    if (!fileKind(f)) {
      setError(`${f.name.split('.').pop()?.toUpperCase()} is not a road photo or clip we can read.`);
      setPhase('error');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    setPhase('idle');
    setUploaded(0);
  }

  async function run() {
    if (!file) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase('uploading');
    setUploaded(0);
    setElapsed(0);
    setResult(null);
    setError(null);

    try {
      const r = await analyzeAndWait(file, {
        conf,
        sampleFps: 2,
        readGpsFromFrame: readGps,
        reverseGeocode: geocode,
        signal: ctrl.signal,
        onUploadProgress: (f) => {
          setUploaded(f);
          if (f >= 1) setPhase('analysing');
        },
        onProgress: (s, ms) => {
          setPhase('analysing');
          setStatus(s);
          setElapsed(ms);
        },
      });
      setResult(r);
      setPhase('done');
      if (r.status === 'failed') setError(r.error ?? 'the detector failed on this file');
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setPhase('idle');
        return;
      }
      setError((e as Error).message);
      setPhase('error');
    } finally {
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setFile(null);
    setResult(null);
    setError(null);
    setPhase('idle');
    setUploaded(0);
  }

  const items = result?.items ?? [];
  const summary = result?.summary;

  return (
    <div
      className="scrollarea rs-row"
      style={{ padding: '20px 28px', display: 'flex', gap: 18, flex: 1, alignItems: 'flex-start' }}
    >
      {/* ── left: drop, progress, results ───────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h1 className="h1">Send in a road</h1>
            <p className="sub" style={{ color: color.c.muted, marginTop: 7 }}>
              A photo or a dashcam clip. The detector reads every frame, keeps the ones with damage,
              and pins them where your camera says you were.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone={service === 'up' ? 'green' : service === 'down' ? 'red' : 'neutral'} dot>
              {service === 'up' ? 'Detector online' : service === 'down' ? 'Detector offline' : 'Checking…'}
            </Chip>
            {file ? <Btn onClick={reset}>Start over</Btn> : null}
          </div>
        </div>

        {/* dropzone */}
        <Panel
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) pick(e.dataTransfer.files?.[0]);
          }}
          style={{
            padding: 0,
            borderStyle: file ? 'solid' : 'dashed',
            borderColor: dragging ? color.mark : color.c.border,
            background: dragging ? '#FFFCF3' : color.c.surface,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => pick(e.target.files?.[0])}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '46px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'inherit',
                color: color.c.ink,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: color.c.inset,
                  border: `1px solid ${color.c.line}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color.c.muted,
                }}
              >
                <IconUp size={20} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.018em' }}>
                Drop a road photo or clip, or choose a file
              </span>
              <span className="tiny" style={{ color: color.c.muted }}>
                JPG · PNG · WEBP · BMP &nbsp;·&nbsp; MP4 · MOV · AVI · MKV · WEBM · M4V
              </span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 14, padding: 14, alignItems: 'center' }}>
              <span
                style={{
                  width: 108,
                  height: 72,
                  borderRadius: 9,
                  overflow: 'hidden',
                  background: color.c.inset,
                  border: `1px solid ${color.c.line}`,
                  flexShrink: 0,
                  display: 'block',
                }}
              >
                {previewUrl && kind === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : previewUrl ? (
                  <video src={previewUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: '-0.014em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </span>
                <span className="tiny" style={{ color: color.c.muted, display: 'block', marginTop: 4 }}>
                  {kind === 'video' ? 'Video' : 'Image'} · {bytes(file.size)}
                  {kind === 'video' ? ' · tracked at 12 fps, reported at 2 fps' : ''}
                </span>

                {busy ? (
                  <span style={{ display: 'block', marginTop: 9 }}>
                    <Bar
                      value={phase === 'uploading' ? uploaded * 100 : 100}
                      color={phase === 'uploading' ? color.blue : color.mark}
                    />
                    <span className="tiny" style={{ color: color.c.muted, display: 'block', marginTop: 6 }}>
                      {phase === 'uploading'
                        ? `Uploading — ${(uploaded * 100).toFixed(0)}%`
                        : `${STATUS_TEXT[status]} — ${secs(elapsed)}`}
                    </span>
                  </span>
                ) : null}
              </span>

              {busy ? (
                <Btn onClick={reset}>Cancel</Btn>
              ) : (
                <Btn primary onClick={run} disabled={service === 'down'}>
                  {result ? 'Analyse again' : 'Analyse this road'}
                </Btn>
              )}
            </div>
          )}
        </Panel>

        {error ? (
          <Panel style={{ borderColor: '#FBDDD9', background: '#FFFBFA', padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: color.red, letterSpacing: '-0.014em' }}>
              That did not go through
            </div>
            <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
              {error}
            </div>
          </Panel>
        ) : null}

        {/* rejected — a real outcome, not an error */}
        {result?.status === 'rejected' ? (
          <Panel style={{ padding: '14px 16px' }}>
            <Chip tone="amber">Not assessed</Chip>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 9, letterSpacing: '-0.014em' }}>
              {result.reason ?? 'this frame could not be assessed'}
            </div>
            <div className="tiny" style={{ color: color.c.muted, marginTop: 6, lineHeight: 1.55 }}>
              The gate runs before detection: a road check and a blur check. It refuses rather than
              guessing, because a detector trained only on roads answers confidently either way.
            </div>
            {result.gate ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <Inset style={{ flex: 1 }}>
                  <div className="num" style={{ fontSize: 18 }}>
                    {((result.gate.road_probability ?? 0) * 100).toFixed(1)}%
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
                    looks like a road surface · needs 50%
                  </div>
                </Inset>
                <Inset style={{ flex: 1 }}>
                  <div className="num" style={{ fontSize: 18 }}>
                    {(result.gate.blur_score ?? 0).toFixed(0)}
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 5 }}>
                    sharpness · needs 100
                  </div>
                </Inset>
              </div>
            ) : null}
          </Panel>
        ) : null}

        {/* summary */}
        {summary && result?.status === 'done' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {[
                [String(summary.uniquePotholes ?? summary.itemCount), 'distinct defects', undefined],
                [
                  summary.overallSeverity,
                  'worst severity found',
                  toneColor(severityTone[summary.overallSeverity], 'light'),
                ],
                [String(summary.framesWithDamage ?? summary.itemCount), 'frames with damage', undefined],
                [String(summary.framesAnalysed ?? 1), 'frames looked at', undefined],
                [`${summary.locatedCount}`, 'carry coordinates', undefined],
              ].map(([v, l, c]) => (
                <Panel key={l} style={{ padding: '12px 14px' }}>
                  <div
                    className="num"
                    style={{ fontSize: 24, color: (c as string) ?? color.c.ink, textTransform: 'capitalize' }}
                  >
                    {v}
                  </div>
                  <div className="tiny" style={{ color: color.c.muted, marginTop: 6 }}>
                    {l}
                  </div>
                </Panel>
              ))}
            </div>

            <Panel flush>
              <PanelHead
                title={`${items.length} frame${items.length === 1 ? '' : 's'} worth reporting`}
                sub={
                  summary.gpsSource === 'frame-overlay-ocr'
                    ? 'Coordinates read off the burned-in camera overlay, frame-synced by construction'
                    : summary.gpsSource === 'gps-log'
                      ? 'Coordinates from the GPS log'
                      : 'No coordinates on this footage'
                }
                right={
                  summary.totalDetections != null ? (
                    <Chip tone="neutral">{summary.totalDetections} raw sightings</Chip>
                  ) : null
                }
              />
              <PanelBody style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {items.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 4px' }}>
                    <span style={{ color: color.green, display: 'flex' }}>
                      <IconCheck size={18} />
                    </span>
                    <span className="sub" style={{ color: color.c.muted }}>
                      No visible damage above the confidence threshold. This stretch reads clean.
                    </span>
                  </div>
                ) : (
                  items.map((it, i) => <ItemRow key={it.id} item={it} last={i === items.length - 1} />)
                )}
              </PanelBody>
            </Panel>
          </>
        ) : null}

        {result?.disclaimer ? (
          <p className="tiny" style={{ color: color.c.dim, lineHeight: 1.55, padding: '0 2px 8px' }}>
            {result.disclaimer}
          </p>
        ) : null}
      </div>

      {/* ── right: settings and notes ───────────────────────────────── */}
      <div
        className="rs-fixed"
        style={{ width: 332, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <Panel>
          <PanelHead title="How hard to look" />
          <PanelBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="lbl" style={{ color: color.c.muted }}>
                Confidence threshold
              </span>
              <span className="mono">{conf.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={conf}
              disabled={busy}
              onChange={(e) => setConf(Number(e.target.value))}
              style={{ width: '100%', marginTop: 10, accentColor: '#0A0A0A' }}
            />
            <div className="tiny" style={{ color: color.c.muted, marginTop: 7, lineHeight: 1.5 }}>
              Lower finds more damage and more false positives. 0.35 is the tuned default.
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Toggle
                on={readGps}
                disabled={busy}
                onChange={setReadGps}
                label="Read GPS off the frame"
                note="OCRs the lat/long your camera burns into the picture."
              />
              <Toggle
                on={geocode}
                disabled={busy}
                onChange={setGeocode}
                label="Look up street names"
                note="The only step that leaves the machine. ~1 second per defect."
              />
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="What the detector is" />
          <PanelBody style={{ paddingTop: 8 }}>
            <p className="tiny" style={{ color: color.c.muted, lineHeight: 1.6 }}>
              Two models: one for cracks, one for potholes. Fine-tuned to mAP@50 0.700 on 149 held-out
              images. A defect visible for a second gets about twelve independent looks, so a clip is
              far more reliable than a single photo.
            </p>
            <Inset style={{ marginTop: 11, display: 'flex', gap: 9, alignItems: 'center' }}>
              <span style={{ color: color.c.muted, display: 'flex' }}>
                <IconCloud size={16} />
              </span>
              <span className="tiny" style={{ color: color.c.muted }}>
                {service === 'up' ? gpu : service === 'down' ? 'Cannot reach the detector' : 'Checking…'}
              </span>
            </Inset>
            <p className="tiny" style={{ color: color.c.dim, lineHeight: 1.6, marginTop: 11 }}>
              Training data is paved roads. On unpaved surfaces it misses a lot, and lowering the
              threshold does not fix that.
            </p>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

/* ── one damaged frame ───────────────────────────────────────────── */

function ItemRow({ item, last }: { item: AnalyzeItem; last: boolean }) {
  const tone = severityTone[item.severity];
  return (
    <div
      style={{
        display: 'flex',
        gap: 13,
        padding: '12px 0',
        borderBottom: last ? undefined : '1px solid #F5F5F5',
        alignItems: 'flex-start',
      }}
    >
      <a
        href={item.imageUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          width: 132,
          height: 84,
          borderRadius: 8,
          overflow: 'hidden',
          background: color.c.inset,
          border: `1px solid ${color.c.line}`,
          flexShrink: 0,
          display: 'block',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={`${item.severityLabel} damage, ${item.detectionCount} detections`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </a>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Chip tone={tone} dot>
            {item.severityLabel}
          </Chip>
          {item.timestamp ? <span className="mono">{item.timestamp}</span> : null}
          <span className="tiny" style={{ color: color.c.muted }}>
            {item.detectionCount} detection{item.detectionCount === 1 ? '' : 's'} ·{' '}
            {(item.confidence * 100).toFixed(0)}% on the one that set the severity
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {item.detections.map((d, i) => (
            <Chip key={i} tone="neutral">
              {CLASS_LABEL[d.damageClass] ?? d.damageClass} · {(d.confidence * 100).toFixed(0)}%
              {d.trackId != null ? ` · #${d.trackId}` : ''}
            </Chip>
          ))}
        </div>

        {item.coordinates ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ color: color.c.dim, display: 'flex' }}>
              <IconMap size={13} />
            </span>
            <span className="mono" style={{ color: color.c.muted }}>
              {item.coordinates.lat.toFixed(5)}, {item.coordinates.lng.toFixed(5)}
            </span>
            {item.address ? (
              <span className="tiny" style={{ color: color.c.muted }}>
                · {item.address}
              </span>
            ) : null}
            {item.mapsUrl ? (
              <a
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="tiny"
                style={{ color: color.blue, textDecoration: 'none' }}
              >
                Open in Maps
              </a>
            ) : null}
          </div>
        ) : (
          <div className="tiny" style={{ color: color.c.dim, marginTop: 8 }}>
            No coordinates on this frame
          </div>
        )}
      </div>
    </div>
  );
}

/* ── toggle ──────────────────────────────────────────────────────── */

function Toggle({
  on,
  onChange,
  label,
  note,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 30,
          height: 18,
          borderRadius: 99,
          background: on ? '#0A0A0A' : color.c.track,
          border: `1px solid ${on ? '#0A0A0A' : color.c.border}`,
          flexShrink: 0,
          marginTop: 1,
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 14 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#FFF',
          }}
        />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.011em' }}>
          {label}
        </span>
        <span className="tiny" style={{ color: color.c.muted, display: 'block', marginTop: 3, lineHeight: 1.45 }}>
          {note}
        </span>
      </span>
    </button>
  );
}
