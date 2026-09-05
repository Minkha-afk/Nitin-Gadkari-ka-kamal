/**
 * The ticket engine: turning detections into work somebody owes an answer on.
 *
 * Three jobs live here.
 *   1. Clustering — the same pothole photographed on three days is one hole in
 *      the road, so a new defect joins a nearby open ticket instead of opening
 *      a duplicate. That is what `passes` counts.
 *   2. The state machine — which transitions are legal, and who may make them.
 *   3. The audit chain — every change appends a hash-linked event, so history
 *      cannot be quietly rewritten. Corrections are new events, never edits.
 */

import { createHash, randomUUID } from 'node:crypto';
import type { AuthorityLevel, Severity, TicketState } from './types';
import {
  authorities,
  nextSeq,
  ticketEvents,
  tickets,
  type DefectDoc,
  type TicketDoc,
  type TicketEventDoc,
} from './mongo';
import { AUTO_TICKET, dueDates, nextLevel, SLA } from './sla';

/** Two sightings this close, of the same damage class, are one defect. */
const CLUSTER_RADIUS_M = 25;

const RANK: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };

/* ── state machine ─────────────────────────────────────────────────── */

export type TicketAction =
  | 'acknowledge'
  | 'assign'
  | 'mark-repaired'
  | 'verify'
  | 'close'
  | 'reopen';

const TRANSITIONS: Record<TicketAction, { from: TicketState[]; to: TicketState; tone: 'good' | 'warn' | 'bad' }> = {
  acknowledge: { from: ['new', 'reopened'], to: 'acknowledged', tone: 'good' },
  assign: { from: ['new', 'acknowledged', 'reopened'], to: 'assigned', tone: 'good' },
  'mark-repaired': { from: ['assigned'], to: 'repaired', tone: 'good' },
  // Verification is deliberately separate from repair: the contractor says it
  // is done, someone else says it is actually done.
  verify: { from: ['repaired'], to: 'verified', tone: 'good' },
  close: { from: ['verified'], to: 'closed', tone: 'good' },
  reopen: { from: ['repaired', 'verified', 'closed'], to: 'reopened', tone: 'bad' },
};

export function allowedActions(state: TicketState): TicketAction[] {
  return (Object.keys(TRANSITIONS) as TicketAction[]).filter((a) =>
    TRANSITIONS[a].from.includes(state),
  );
}

/* ── audit chain ───────────────────────────────────────────────────── */

const GENESIS = '0'.repeat(64);

function hashEvent(e: Omit<TicketEventDoc, '_id' | 'hash'>) {
  // Canonical field order — the hash must not depend on key order.
  const payload = JSON.stringify([e.ticketId, e.seq, e.action, e.actor, e.note, e.at.toISOString(), e.prevHash]);
  return createHash('sha256').update(payload).digest('hex');
}

export async function appendEvent(
  ticketId: string,
  action: string,
  actor: string,
  note: string | null,
  tone: 'good' | 'warn' | 'bad',
) {
  const col = await ticketEvents();
  const last = await col.find({ ticketId }).sort({ seq: -1 }).limit(1).next();
  const base = {
    ticketId,
    seq: (last?.seq ?? 0) + 1,
    action,
    actor,
    note,
    at: new Date(),
    prevHash: last?.hash ?? GENESIS,
    tone,
  };
  const doc: TicketEventDoc = { _id: randomUUID(), ...base, hash: hashEvent(base) };
  await col.insertOne(doc);
  return doc;
}

/** Recompute the chain and report the first row that does not line up. */
export async function verifyChain(ticketId: string) {
  const col = await ticketEvents();
  const rows = await col.find({ ticketId }).sort({ seq: 1 }).toArray();
  let prev = GENESIS;
  for (const r of rows) {
    const expected = hashEvent({ ...r, prevHash: prev });
    if (r.prevHash !== prev || r.hash !== expected) {
      return { intact: false, brokenAtSeq: r.seq, events: rows.length };
    }
    prev = r.hash;
  }
  return { intact: true, brokenAtSeq: null, events: rows.length };
}

/* ── routing to an authority ───────────────────────────────────────── */

/**
 * Whoever's jurisdiction contains the point, most specific first. Returns null
 * when no authority has been set up or none covers the point — a ticket with
 * no owner is honest; inventing one is not.
 */
export async function authorityFor(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return null;
  const col = await authorities();
  const hits = await col
    .find({ area: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } } })
    .toArray();
  if (!hits.length) return null;
  const order: AuthorityLevel[] = ['ward_engineer', 'executive_engineer', 'commissioner', 'state_department'];
  hits.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  return hits[0];
}

/* ── opening tickets ───────────────────────────────────────────────── */

export async function mintTicketId(now = new Date()) {
  const year = now.getUTCFullYear();
  const n = await nextSeq(`ticket-${year}`);
  return `RS-${year}-${String(n).padStart(4, '0')}`;
}

export function shouldAutoTicket(severity: Severity) {
  return AUTO_TICKET.includes(severity);
}

/**
 * Open a ticket for a defect, or fold it into the open ticket already covering
 * that spot. Returns the ticket and whether it was newly created.
 */
export async function ticketForDefect(defect: DefectDoc, actor = 'detector') {
  const col = await tickets();
  const now = new Date();

  if (defect.lat != null && defect.lng != null) {
    const nearby = await col.findOne({
      damageClass: defect.damageClass,
      state: { $nin: ['closed', 'verified'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [defect.lng, defect.lat] },
          $maxDistance: CLUSTER_RADIUS_M,
        },
      },
    });

    if (nearby) {
      if (nearby.defectIds.includes(defect._id)) return { ticket: nearby, created: false };

      // A worse sighting escalates the ticket and resets the fix clock.
      const worse = RANK[defect.severity] > RANK[nearby.severity];
      const severity = worse ? defect.severity : nearby.severity;
      const due = worse ? dueDates(severity, now) : { slaFixDue: nearby.slaFixDue, slaAckDue: nearby.slaAckDue };

      await col.updateOne(
        { _id: nearby._id },
        {
          $set: {
            severity,
            severityLabel: worse ? defect.severityLabel : nearby.severityLabel,
            confidence: Math.max(nearby.confidence, defect.confidence),
            address: nearby.address ?? defect.address,
            ...due,
            updatedAt: now,
          },
          $inc: { passes: 1 },
          // Only a worse reading is history worth keeping: a later, milder pass
          // is usually a worse camera angle, not a road that healed.
          ...(worse ? { $push: { severityHistory: { severity: defect.severity, at: now } } } : {}),
          $addToSet: {
            defectIds: defect._id,
            ...(defect.deviceId ? { reportedBy: defect.deviceId } : {}),
          },
        },
      );
      await appendEvent(
        nearby._id,
        'sighting-added',
        actor,
        worse
          ? `Seen again, worse than before — now ${defect.severity}`
          : `Seen again (${(defect.confidence * 100).toFixed(0)}% confidence)`,
        worse ? 'bad' : 'warn',
      );
      const updated = await col.findOne({ _id: nearby._id });
      return { ticket: updated!, created: false };
    }
  }

  const authority = await authorityFor(defect.lat, defect.lng);
  const { slaAckDue, slaFixDue } = dueDates(defect.severity, now);
  const doc: TicketDoc = {
    _id: await mintTicketId(now),
    defectIds: [defect._id],
    damageClass: defect.damageClass,
    severity: defect.severity,
    severityLabel: defect.severityLabel,
    confidence: defect.confidence,
    location: defect.location,
    lat: defect.lat,
    lng: defect.lng,
    address: defect.address,
    imageUrl: defect.imageUrl,
    mapsUrl: defect.mapsUrl,
    passes: 1,
    state: 'new',
    level: authority?.level ?? 'ward_engineer',
    authorityId: authority?._id ?? null,
    contractorId: null,
    slaAckDue,
    slaFixDue,
    severityHistory: [{ severity: defect.severity, at: now }],
    escalationCount: 0,
    lastEscalatedAt: null,
    acknowledgedAt: null,
    assignedAt: null,
    repairedAt: null,
    verifiedAt: null,
    closedAt: null,
    reportedBy: defect.deviceId ? [defect.deviceId] : [],
    followers: defect.deviceId ? [defect.deviceId] : [],
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  await appendEvent(
    doc._id,
    'opened',
    actor,
    authority ? `Routed to ${authority.name}` : 'No authority covers this point yet — unassigned',
    'warn',
  );
  return { ticket: doc, created: true };
}

/* ── moving a ticket along ─────────────────────────────────────────── */

export async function transition(
  ticketId: string,
  action: TicketAction,
  actor: string,
  opts: { note?: string | null; contractorId?: string | null } = {},
) {
  const rule = TRANSITIONS[action];
  if (!rule) throw new Error(`unknown action "${action}"`);

  const col = await tickets();
  const ticket = await col.findOne({ _id: ticketId });
  if (!ticket) throw new Error(`no ticket ${ticketId}`);
  if (!rule.from.includes(ticket.state)) {
    throw new Error(`cannot ${action} a ticket that is ${ticket.state}`);
  }
  if (action === 'assign' && !opts.contractorId) {
    throw new Error('assign needs a contractorId');
  }

  const now = new Date();
  const stamps: Partial<TicketDoc> = { state: rule.to, updatedAt: now };
  if (action === 'acknowledge') stamps.acknowledgedAt = now;
  if (action === 'assign') {
    stamps.assignedAt = now;
    stamps.contractorId = opts.contractorId ?? null;
  }
  if (action === 'mark-repaired') stamps.repairedAt = now;
  if (action === 'verify') stamps.verifiedAt = now;
  if (action === 'close') stamps.closedAt = now;
  if (action === 'reopen') {
    // The damage came back: a fresh clock, and the repair stamps no longer hold.
    Object.assign(stamps, dueDates(ticket.severity, now), {
      repairedAt: null,
      verifiedAt: null,
      closedAt: null,
    });
  }

  await col.updateOne({ _id: ticketId }, { $set: stamps });
  await appendEvent(ticketId, action, actor, opts.note ?? null, rule.tone);
  return (await col.findOne({ _id: ticketId }))!;
}

/**
 * Anything past its acknowledge deadline and still unacknowledged moves one
 * step up the chain.
 *
 * Escalating also restarts the acknowledge clock, so the level it just landed
 * on gets its own window to respond. That is what makes this safe to run on a
 * tight cron: a second run a minute later finds nothing newly overdue, rather
 * than marching the same ticket to the state department in four calls.
 */
export async function escalateOverdue(now = new Date()) {
  const col = await tickets();
  const stale = await col
    .find({ state: { $in: ['new', 'reopened'] }, slaAckDue: { $lt: now } })
    .limit(200)
    .toArray();

  const moved: { id: string; from: AuthorityLevel; to: AuthorityLevel }[] = [];
  for (const t of stale) {
    const to = nextLevel(t.level);
    if (!to) continue;
    const ackHours = (SLA[t.severity] ?? SLA.low!).ackHours;
    await col.updateOne(
      { _id: t._id },
      {
        $set: {
          level: to,
          slaAckDue: new Date(now.getTime() + ackHours * 3_600_000),
          lastEscalatedAt: now,
          updatedAt: now,
        },
        $inc: { escalationCount: 1 },
      },
    );
    await appendEvent(
      t._id,
      'escalated',
      'system',
      `Not acknowledged by the deadline — escalated from ${t.level} to ${to}`,
      'bad',
    );
    moved.push({ id: t._id, from: t.level, to });
  }
  return moved;
}
