/**
 * MongoDB connection, cached across hot reloads.
 *
 * Two collections:
 *   uploads — one document per analysis job (the file someone sent in)
 *   defects — one document per physical defect, deduplicated by track id
 *
 * MONGODB_URI is read at call time, not at import time, so the app still
 * builds and runs with the database unconfigured — every route that needs it
 * reports "database not configured" instead of crashing the process.
 */

import { MongoClient, type Collection, type Db } from 'mongodb';
import type { DamageClass, Severity } from './types';

export interface DefectDoc {
  /** `{jobId}:t{trackId}` for tracked video defects, `{jobId}:{itemId}:{n}` otherwise. */
  _id: string;
  jobId: string;
  trackId: number | null;
  damageClass: DamageClass;
  severity: Severity;
  /** The model's own wording, e.g. "Severe". */
  severityLabel: string;
  confidence: number;
  /** GeoJSON Point, [lng, lat] — the order Mongo's 2dsphere index requires. */
  location: { type: 'Point'; coordinates: [number, number] } | null;
  lat: number | null;
  lng: number | null;
  /** Reverse-geocoded street name. Null unless the lookup ran or succeeded. */
  address: string | null;
  mapsUrl: string | null;
  imageUrl: string;
  frameNumber: number | null;
  timestamp: string | null;
  timeS: number | null;
  bbox: [number, number, number, number];
  /** How many frames this same defect was seen in. */
  sightings: number;
  fileName: string | null;
  capturedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadDoc {
  _id: string; // jobId
  fileName: string | null;
  kind: 'image' | 'video';
  status: string;
  reason: string | null;
  summary: unknown;
  defectCount: number;
  locatedCount: number;
  disclaimer: string | null;
  processedAt: string | null;
  createdAt: Date;
}

const DB_NAME = process.env.MONGODB_DB ?? 'roadsense';

type Cache = { client: MongoClient; db: Db; indexed: Promise<void> };
const globalCache = globalThis as unknown as { _roadsenseMongo?: Cache };

export function isConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set — add it to .env.local');

  if (!globalCache._roadsenseMongo) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    const db = client.db(DB_NAME);
    globalCache._roadsenseMongo = { client, db, indexed: ensureIndexes(db) };
    await client.connect();
  }
  await globalCache._roadsenseMongo.indexed;
  return globalCache._roadsenseMongo.db;
}

async function ensureIndexes(db: Db) {
  // Sparse, because a defect with no GPS is still worth keeping — it just
  // cannot go on the map, and a null location would break the 2dsphere index.
  await db.collection('defects').createIndex({ location: '2dsphere' }, { sparse: true });
  await db.collection('defects').createIndex({ jobId: 1 });
  await db.collection('defects').createIndex({ severity: 1 });
  await db.collection('uploads').createIndex({ createdAt: -1 });
}

export async function defects(): Promise<Collection<DefectDoc>> {
  return (await getDb()).collection<DefectDoc>('defects');
}

export async function uploads(): Promise<Collection<UploadDoc>> {
  return (await getDb()).collection<UploadDoc>('uploads');
}
