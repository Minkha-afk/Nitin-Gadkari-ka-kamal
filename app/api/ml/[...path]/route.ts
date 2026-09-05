/**
 * Proxy to the Road Damage Detection API.
 *
 * Everything the browser needs from the ML service goes through here:
 *   /api/ml/analyze          → POST  {base}/analyze
 *   /api/ml/analyze/{jobId}  → GET   {base}/analyze/{jobId}
 *   /api/ml/results/…jpg     → GET   {base}/results/…jpg   (annotated frames)
 *
 * Two reasons this is a proxy and not a direct browser call:
 *   1. The API key stays on the server. NEXT_PUBLIC_ anything would ship it
 *      to every visitor.
 *   2. ngrok's free tier serves a browser interstitial unless the request
 *      carries `ngrok-skip-browser-warning`, which an <img> tag cannot set.
 *
 * Absolute `imageUrl`s in the JSON are rewritten to point back at this proxy,
 * so nothing in the UI has to know the upstream host exists.
 */

import { NextRequest } from 'next/server';

const BASE = (process.env.ML_API_BASE ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
const KEY = process.env.ML_API_KEY ?? '';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** `http://host:8000/results/x.jpg` → `/api/ml/results/x.jpg` */
function rewriteUrls(body: string) {
  return body.split(`${BASE}/`).join('/api/ml/').replace(/https?:\/\/[^"\s]*?\/results\//g, '/api/ml/results/');
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  if (!KEY) {
    return Response.json(
      { status: 'failed', items: [], error: 'ML_API_KEY is not set — copy .env.example to .env.local.' },
      { status: 500 },
    );
  }

  const { path = [] } = await ctx.params;
  const target = `${BASE}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers({
    'X-API-Key': KEY,
    'ngrok-skip-browser-warning': '1',
    accept: req.headers.get('accept') ?? '*/*',
  });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers, redirect: 'follow' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Stream the upload rather than buffering it — videos are large.
    init.body = req.body;
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return Response.json(
      { status: 'failed', items: [], error: `cannot reach the detection service: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const type = upstream.headers.get('content-type') ?? 'application/octet-stream';

  if (type.includes('application/json')) {
    const text = await upstream.text();
    return new Response(rewriteUrls(text), {
      status: upstream.status,
      headers: { 'content-type': type, 'cache-control': 'no-store' },
    });
  }

  if (type.startsWith('image/') || type.startsWith('video/') || type.includes('octet-stream')) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': type, 'cache-control': 'public, max-age=3600' },
    });
  }

  // Anything else is not the API talking — an ngrok interstitial or offline
  // page, say. Turn it into the shape the client already knows how to show.
  const text = await upstream.text();
  const offline = text.includes('ERR_NGROK_3200') || text.includes('is offline');
  return Response.json(
    {
      status: 'failed',
      items: [],
      error: offline
        ? 'the detection service is offline — start it and re-open the tunnel'
        : `the detection service replied with ${upstream.status} (${type})`,
    },
    { status: 502 },
  );
}

export const GET = proxy;
export const POST = proxy;
