/**
 * MongoDB connection, cached across hot reloads.
 *
 * Collections:
 *   uploads     — one document per analysis job (the file someone sent in)
 *   defects     — one document per physical defect, deduplicated by track id
 *   tickets     — a defect escalated into work someone owes an answer on
 *   ticketEvents— append-only, hash-chained audit trail per ticket
 *   authorities — who owns which stretch of road
 *   contractors — who gets assigned the repair
 *   counters    — atomic sequence numbers for human-readable ticket ids
 *
 * MONGODB_URI is read at call time, not at import time, so the app still
 * builds and runs with the database unconfigured — every route that needs it
 * reports "database not configured" instead of crashing the process.
 */

import { MongoClient, type Collection, type Db } from 'mongodb';
import type { AuthorityLevel, DamageClass, Severity, TicketState } from './types';

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
  /** Which browser sent this in. Set from the rs_device cookie; no accounts yet. */
  deviceId: string | null;
  /** Set once this defect has been rolled into a ticket. */
  ticketId: string | null;
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
  deviceId: string | null;
  createdAt: Date;
}

/**
 * Who owns a road. Levels come from lib/types.ts and form a chain: a ticket
 * nobody acknowledges escalates up it.
 */
export interface AuthorityDoc {
  _id: string; // slug, e.g. "gmc-ward-32"
  name: string;
  level: AuthorityLevel;
  parentId: string | null;
  contact: { email?: string; phone?: string } | null;
  /** Jurisdiction boundary. A ticket inside it routes here automatically. */
  area: { type: 'Polygon'; coordinates: number[][][] } | null;
  createdAt: Date;
}

export interface ContractorDoc {
  _id: string;
  name: string;
  panel: string | null;
  ratePerM2: number | null;
  since: number | null;
  createdAt: Date;
}

/**
 * A defect somebody now owes an answer on.
 *
 * One ticket can cover several defect documents: the same pothole photographed
 * on three different days is one hole in the road, and `passes` counts how many
 * independent sightings back it up.
 */
export interface TicketDoc {
  _id: string; // human-readable, e.g. "RS-2026-0007"
  defectIds: string[];
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  confidence: number;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  imageUrl: string;
  mapsUrl: string | null;
  /** Independent sightings behind this ticket. */
  passes: number;
  state: TicketState;
  level: AuthorityLevel;
  authorityId: string | null;
  contractorId: string | null;
  slaAckDue: Date;
  slaFixDue: Date;
  /** Every severity this ticket has held, in order. A rising list is a road getting worse. */
  severityHistory: { severity: Severity; at: Date }[];
  /** How many times it climbed the chain, and when it last did. */
  escalationCount: number;
  lastEscalatedAt: Date | null;
  acknowledgedAt: Date | null;
  assignedAt: Date | null;
  repairedAt: Date | null;
  verifiedAt: Date | null;
  closedAt: Date | null;
  /** Devices that reported it, and devices watching it. */
  reportedBy: string[];
  followers: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One line of a ticket's history. Append-only and hash-chained: every event
 * carries the hash of the one before it, so a row cannot be edited or removed
 * later without breaking every hash after it. Corrections are new events.
 */
export interface TicketEventDoc {
  _id: string;
  ticketId: string;
  seq: number;
  action: string;
  actor: string;
  note: string | null;
  at: Date;
  prevHash: string;
  hash: string;
  tone: 'good' | 'warn' | 'bad';
}

export interface CounterDoc {
  _id: string;
  seq: number;
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
  await Promise.all([
    db.collection('defects').createIndex({ location: '2dsphere' }, { sparse: true }),
    db.collection('defects').createIndex({ jobId: 1 }),
    db.collection('defects').createIndex({ severity: 1 }),
    db.collection('defects').createIndex({ deviceId: 1, createdAt: -1 }),
    db.collection('defects').createIndex({ ticketId: 1 }),
    db.collection('uploads').createIndex({ createdAt: -1 }),
    db.collection('uploads').createIndex({ deviceId: 1, createdAt: -1 }),
    db.collection('tickets').createIndex({ location: '2dsphere' }, { sparse: true }),
    db.collection('tickets').createIndex({ state: 1, slaFixDue: 1 }),
    db.collection('tickets').createIndex({ authorityId: 1, state: 1 }),
    db.collection('tickets').createIndex({ reportedBy: 1, createdAt: -1 }),
    db.collection('tickets').createIndex({ followers: 1 }),
    db.collection('tickets').createIndex({ createdAt: -1 }),
    // One chain per ticket: seq is unique within it.
    db.collection('ticketEvents').createIndex({ ticketId: 1, seq: 1 }, { unique: true }),
    db.collection('authorities').createIndex({ area: '2dsphere' }, { sparse: true }),
    db.collection('authorities').createIndex({ level: 1 }),
  ]);
}

export async function defects(): Promise<Collection<DefectDoc>> {
  return (await getDb()).collection<DefectDoc>('defects');
}

export async function uploads(): Promise<Collection<UploadDoc>> {
  return (await getDb()).collection<UploadDoc>('uploads');
}

export async function tickets(): Promise<Collection<TicketDoc>> {
  return (await getDb()).collection<TicketDoc>('tickets');
}

export async function ticketEvents(): Promise<Collection<TicketEventDoc>> {
  return (await getDb()).collection<TicketEventDoc>('ticketEvents');
}

export async function authorities(): Promise<Collection<AuthorityDoc>> {
  return (await getDb()).collection<AuthorityDoc>('authorities');
}

export async function contractors(): Promise<Collection<ContractorDoc>> {
  return (await getDb()).collection<ContractorDoc>('contractors');
}

/** Atomic sequence, so two simultaneous uploads cannot mint the same ticket id. */
export async function nextSeq(name: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .collection<CounterDoc>('counters')
    .findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
  return row?.seq ?? 1;
}
