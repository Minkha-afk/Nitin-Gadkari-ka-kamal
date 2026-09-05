'use client';

/**
 * Send in a road.
 *
 * One instruction, one enormous target, then the result as photographs. The
 * settings that used to sit in a sidebar are folded away — nobody adjusts a
 * confidence threshold on their first upload, and putting it in the front door
 * made the front door look like a control panel.
 */

import React from 'react';
import { Divider, Empty, Eyebrow, Figure, Pill, SectionHead, SevBadgeOnShot, SEV } from '@/components/citizen/ui';
import { IconCheck, IconUp } from '@/components/chrome/Icons';
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

type Phase = 'idle' | 'uploading' | 'analysing' | 'done' | 'error';

const STATUS_TEXT: Record<AnalyzeStatus, string> = {
  queued: 'Queued',
  processing: 'Reading every frame',
  done: 'Done',
  failed: 'Failed',
  rejected: 'Not assessed',
};

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
  const [saved, setSaved] = React.useState<{ stored: number; located: number } | { note: string } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);

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
      .then(() => live && setService('up'))
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
    setSaved(null);
    setPhase('idle');
    setUploaded(0);
  }

  async function persist(r: AnalyzeResult, name: string) {
    try {
      const res = await fetch('/api/defects/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ result: r, fileName: name }),
      });
      const body = await res.json();
      if (!res.ok) setSaved({ note: body.error ?? 'could not save' });
      else if (body.skipped) setSaved({ note: body.skipped });
      else setSaved({ stored: body.stored, located: body.located });
    } catch (e) {
      setSaved({ note: (e as Error).message });
    }
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
    setSaved(null);
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
      if (r.status === 'done') void persist(r, file.name);
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
    setSaved(null);
    setPhase('idle');
    setUploaded(0);
  }

  const items = result?.items ?? [];
  const summary = result?.summary;

  return (
    <div className="stack-xl" style={{ paddingTop: 48 }}>
      <section className="shell">
        <Eyebrow>Contribute</Eyebrow>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '13ch' }}>
          Send in a road.
        </h1>
        <p className="lede" style={{ marginTop: 18 }}>
          A photo or a dashcam clip. Two models read every frame, keep the ones with damage, and pin
          them where your camera says you were.
        </p>
      </section>

      {/* ── the target ───────────────────────────────────────────────── */}
      <section className="shell">
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            style={{
              width: '100%',
              borderRadius: 26,
              border: `2px dashed ${dragging ? 'var(--mark)' : 'var(--hairline)'}`,
              background: dragging ? '#FFFCF2' : 'var(--card)',
              padding: 'clamp(48px, 8vw, 96px) 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 0.24s var(--ease), background 0.24s var(--ease)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 62,
                height: 62,
                borderRadius: 999,
                background: 'var(--mark)',
                color: '#17130A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconUp size={24} />
            </span>
            <span className="display-sm" style={{ textAlign: 'center' }}>
              Drop it here
            </span>
            <span className="copy" style={{ textAlign: 'center' }}>
              or choose a file · JPG PNG WEBP BMP · MP4 MOV AVI MKV WEBM M4V
            </span>
          </button>
        ) : (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="shot" style={{ width: 168, aspectRatio: '4 / 3', borderRadius: 14, flexShrink: 0 }}>
                {previewUrl && kind === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="" />
                ) : previewUrl ? (
                  <video src={previewUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Eyebrow>
                    {kind === 'video' ? 'Video' : 'Image'} · {bytes(file.size)}
                    {kind === 'video' ? ' · tracked at 12 fps' : ''}
                  </Eyebrow>
                </div>

                {busy ? (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ height: 6, borderRadius: 999, background: '#EFEDE9', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: phase === 'uploading' ? `${uploaded * 100}%` : '100%',
                          height: '100%',
                          background: 'var(--mark)',
                          borderRadius: 999,
                          transition: 'width 0.3s var(--ease)',
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Eyebrow>
                        {phase === 'uploading'
                          ? `Uploading ${(uploaded * 100).toFixed(0)}%`
                          : `${STATUS_TEXT[status]} · ${(elapsed / 1000).toFixed(0)}s`}
                      </Eyebrow>
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {busy ? (
                  <Pill variant="ghost" onClick={reset}>Cancel</Pill>
                ) : (
                  <>
                    <Pill variant="ghost" onClick={reset}>Change</Pill>
                    <Pill variant="mark" onClick={run} disabled={service === 'down'}>
                      {result ? 'Analyse again' : 'Analyse this road'}
                    </Pill>
                  </>
                )}
              </div>
            </div>

            {service === 'down' ? (
              <p className="copy" style={{ marginTop: 16, color: SEV.critical.ink }}>
                The detector is offline, so nothing can be analysed right now.
              </p>
            ) : null}
          </div>
        )}

        {/* settings, folded away */}
        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="pill pill-ghost pill-sm"
            disabled={busy}
          >
            {showSettings ? 'Hide' : 'How hard to look'}
          </button>

          {showSettings ? (
            <div className="card rise" style={{ padding: 22, marginTop: 14, maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Eyebrow>Confidence threshold</Eyebrow>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{conf.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.8}
                step={0.05}
                value={conf}
                disabled={busy}
                onChange={(e) => setConf(Number(e.target.value))}
                style={{ width: '100%', marginTop: 12, accentColor: '#0A0A0A' }}
              />
              <p className="copy" style={{ marginTop: 10, fontSize: 13.5 }}>
                Lower finds more damage and more false positives. 0.35 is the tuned default.
              </p>
              <div style={{ height: 18 }} />
              <Divider />
              <div style={{ height: 18 }} />
              <Toggle on={readGps} disabled={busy} onChange={setReadGps} label="Read GPS off the frame" note="OCRs the lat/long your camera burns into the picture." />
              <div style={{ height: 14 }} />
              <Toggle on={geocode} disabled={busy} onChange={setGeocode} label="Look up street names" note="The only step that leaves the machine. About a second per defect." />
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="shell">
          <div className="card" style={{ padding: 24, borderColor: '#FBDDD9', background: '#FFFBFA' }}>
            <div className="title" style={{ color: SEV.critical.ink }}>That did not go through</div>
            <p className="copy" style={{ marginTop: 8 }}>{error}</p>
          </div>
        </section>
      ) : null}

      {/* ── rejected ─────────────────────────────────────────────────── */}
      {result?.status === 'rejected' ? (
        <section className="shell">
          <div className="card rise" style={{ padding: 'clamp(24px, 3vw, 40px)' }}>
            <Eyebrow>Not assessed</Eyebrow>
            <h2 className="display-sm" style={{ marginTop: 14, maxWidth: '20ch' }}>
              {result.reason ?? 'This could not be assessed.'}
            </h2>
            <p className="copy" style={{ marginTop: 14, maxWidth: '60ch' }}>
              Two checks run before detection: is this a road, and is it sharp enough to judge. The
              detector refuses rather than guessing — trained only on roads, it would answer confidently
              either way.
            </p>
            {result.gate ? (
              <div style={{ display: 'flex', gap: 44, marginTop: 28, flexWrap: 'wrap' }}>
                <Figure
                  value={`${((result.gate.road_probability ?? 0) * 100).toFixed(1)}%`}
                  label="looks like road · needs 50%"
                />
                <Figure value={(result.gate.blur_score ?? 0).toFixed(0)} label="sharpness · needs 100" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── result ───────────────────────────────────────────────────── */}
      {summary && result?.status === 'done' ? (
        <>
          <section className="shell rise">
            <SectionHead
              kicker="Result"
              title={
                items.length === 0
                  ? 'This road reads clean.'
                  : `${summary.uniquePotholes ?? items.length} defect${
                      (summary.uniquePotholes ?? items.length) === 1 ? '' : 's'
                    } found.`
              }
              sub={
                saved && 'stored' in saved
                  ? `Saved to the road map — ${saved.located} of ${saved.stored} with coordinates. Anyone routing through here now gets warned.`
                  : saved && 'note' in saved
                    ? saved.note
                    : undefined
              }
            />
            <div style={{ height: 30 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 28 }}>
              <Figure
                value={summary.overallSeverity}
                label="worst severity"
                tint={SEV[summary.overallSeverity].ink}
              />
              <Figure value={summary.framesWithDamage ?? items.length} label="frames with damage" />
              <Figure value={summary.framesAnalysed ?? 1} label="frames read" />
              <Figure value={summary.locatedCount} label="carry coordinates" />
            </div>
          </section>

          {items.length ? (
            <section className="shell" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {items.map((it) => (
                <FrameCard key={it.id} item={it} />
              ))}
            </section>
          ) : (
            <section className="shell">
              <div className="card" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: SEV.good.ink, display: 'flex' }}>
                  <IconCheck size={22} />
                </span>
                <p className="copy" style={{ margin: 0 }}>
                  No visible damage above the confidence threshold. This stretch reads clean.
                </p>
              </div>
            </section>
          )}
        </>
      ) : null}

      {result?.disclaimer ? (
        <section className="shell">
          <p className="copy" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{result.disclaimer}</p>
        </section>
      ) : null}

      {!file && !result ? (
        <section className="shell">
          <Empty
            kicker="Why it matters"
            title="Twelve looks beat one photo"
            body="A defect visible for a second gets about twelve independent chances in a clip. Single frames miss things; footage rarely does."
          />
        </section>
      ) : null}
    </div>
  );
}

function FrameCard({ item }: { item: AnalyzeItem }) {
  return (
    <article className="card" style={{ padding: 12, overflow: 'hidden' }}>
      <a href={item.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
        <div className="shot" style={{ aspectRatio: '4 / 3', borderRadius: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={`${item.severityLabel} damage`} />
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
            <SevBadgeOnShot severity={item.severity}>{item.severityLabel}</SevBadgeOnShot>
          </div>
        </div>
      </a>
      <div style={{ padding: '15px 6px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="title">{item.detectionCount} detection{item.detectionCount === 1 ? '' : 's'}</span>
          {item.timestamp ? <Eyebrow>{item.timestamp}</Eyebrow> : null}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
          {item.detections.map((d, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 28,
                padding: '0 11px',
                borderRadius: 999,
                border: '1px solid var(--hairline)',
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {CLASS_LABEL[d.damageClass] ?? d.damageClass}
              <span style={{ color: 'var(--ink-3)' }}>{(d.confidence * 100).toFixed(0)}%</span>
            </span>
          ))}
        </div>
        {item.coordinates ? (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Eyebrow>
              {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
            </Eyebrow>
            {item.mapsUrl ? (
              <a
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: '#175CD3', textDecoration: 'none' }}
              >
                Maps
              </a>
            ) : null}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Eyebrow>No coordinates on this frame</Eyebrow>
          </div>
        )}
        {item.address ? (
          <p className="copy" style={{ fontSize: 13, marginTop: 8 }}>{item.address}</p>
        ) : null}
      </div>
    </article>
  );
}

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
        gap: 13,
        alignItems: 'flex-start',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        width: '100%',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 42,
          height: 25,
          borderRadius: 999,
          background: on ? 'var(--ink)' : '#E4E1DC',
          flexShrink: 0,
          position: 'relative',
          transition: 'background 0.22s var(--ease)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 20 : 3,
            width: 19,
            height: 19,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.22s var(--ease)',
          }}
        />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, letterSpacing: '-0.014em' }}>{label}</span>
        <span className="copy" style={{ display: 'block', fontSize: 13.5, marginTop: 3 }}>{note}</span>
      </span>
    </button>
  );
}
