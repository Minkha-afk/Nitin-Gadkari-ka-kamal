/**
 * Everything the authority screens read, straight from MongoDB.
 *
 * Scope is an authority id held in the rs_authority cookie. An authority sees
 * its own tickets and everything below it in the tree, because that is what
 * "Zone 3" means — an executive engineer answers for the wards under them.
 * No cookie means the whole database; `unassigned` means tickets no registered
 * authority covers, which is where they land until someone registers a
 * jurisdiction that contains them.
 */

import { cookies } from 'next/headers';
import {
  authorities,
  contractors,
  defects,
  isConfigured,
  ticketEvents,
  tickets,
  uploads,
  type AuthorityDoc,
  type ContractorDoc,
  type DefectDoc,
  type TicketDoc,
  type TicketEventDoc,
} from './mongo';
import { ticketStanding, type Urgency } from './standing';
import { nextLevel } from './ladder';
import { verifyChain } from './tickets';
import type { AuthorityLevel, DamageClass, Severity, TicketState } from './types';

export const SCOPE_COOKIE = 'rs_authority';

export const SETTLED: TicketState[] = ['repaired', 'verified', 'closed'];
const OPEN: TicketState[] = ['new', 'acknowledged', 'assigned', 'reopened'];

/* ── the tree ──────────────────────────────────────────────────────── */

export interface AuthorityNode {
  id: string;
  name: string;
  level: AuthorityLevel;
  parentId: string | null;
  depth: number;
  openCount: number;
}

export interface AuthorityTree {
  configured: boolean;
  nodes: AuthorityNode[];
  unassignedOpen: number;
  totalOpen: number;
}

export async function getAuthorityTree(): Promise<AuthorityTree> {
  if (!isConfigured()) return { configured: false, nodes: [], unassignedOpen: 0, totalOpen: 0 };
  try {
    const [authCol, ticketCol] = await Promise.all([authorities(), tickets()]);
    const [rows, counts] = await Promise.all([
      authCol.find({}).toArray(),
      ticketCol
        .aggregate<{ _id: string | null; open: number }>([
          { $match: { state: { $in: OPEN } } },
          { $group: { _id: '$authorityId', open: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const direct = new Map(counts.map((c) => [c._id, c.open]));
    const byParent = new Map<string | null, AuthorityDoc[]>();
    for (const a of rows) {
      const list = byParent.get(a.parentId) ?? [];
      list.push(a);
      byParent.set(a.parentId, list);
    }

    // Depth-first, so children sit under their parent in the rendered list.
    const nodes: AuthorityNode[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const a of (byParent.get(parentId) ?? []).sort((x, y) => x.name.localeCompare(y.name))) {
        nodes.push({
          id: a._id,
          name: a.name,
          level: a.level,
          parentId: a.parentId,
          depth,
          openCount: 0,
        });
        walk(a._id, depth + 1);
      }
    };
    walk(null, 0);

    // An authority's count includes everything beneath it.
    const kids = new Map<string, string[]>();
    for (const n of nodes) {
      if (!n.parentId) continue;
      kids.set(n.parentId, [...(kids.get(n.parentId) ?? []), n.id]);
    }
    const rollup = (id: string): number =>
      (direct.get(id) ?? 0) + (kids.get(id) ?? []).reduce((n, k) => n + rollup(k), 0);
    for (const n of nodes) n.openCount = rollup(n.id);

    return {
      configured: true,
      nodes,
      unassignedOpen: direct.get(null) ?? 0,
      totalOpen: [...direct.values()].reduce((a, b) => a + b, 0),
    };
  } catch {
    return { configured: true, nodes: [], unassignedOpen: 0, totalOpen: 0 };
  }
}

export async function selectedScope(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SCOPE_COOKIE)?.value ?? null;
}

/** Mongo filter for the current scope, including everything below it. */
export async function scopeFilter(scope: string | null): Promise<Record<string, unknown>> {
  if (!scope || scope === 'all') return {};
  if (scope === 'unassigned') return { authorityId: null };
  const { nodes } = await getAuthorityTree();
  const ids = [scope];
  const push = (parent: string) => {
    for (const n of nodes.filter((x) => x.parentId === parent)) {
      ids.push(n.id);
      push(n.id);
    }
  };
  push(scope);
  return { authorityId: { $in: ids } };
}

export async function scopeName(scope: string | null): Promise<string> {
  if (!scope || scope === 'all') return 'Everything reported';
  if (scope === 'unassigned') return 'Unassigned tickets';
  const { nodes } = await getAuthorityTree();
  return nodes.find((n) => n.id === scope)?.name ?? scope;
}

/* ── views ─────────────────────────────────────────────────────────── */

export interface TicketRow {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  confidence: number;
  address: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string;
  state: TicketState;
  level: AuthorityLevel;
  authorityId: string | null;
  contractorId: string | null;
  passes: number;
  /** How many times somebody forwarded it up the chain. */
  escalationCount: number;
  escalated: boolean;
  urgency: Urgency;
  /** Ready to print, e.g. "40 min" or "3 d". */
  ageValue: string;
  /** Ready to print on its own, e.g. "3 d open". */
  ageLabel: string;
  ageHours: number;
  ageDays: number;
  createdAt: string;
  lastEscalatedAt: string | null;
  /** True when nobody is above the level holding it. */
  atTopOfChain: boolean;
}

export function toRow(t: TicketDoc): TicketRow {
  return {
    id: t._id,
    damageClass: t.damageClass,
    severity: t.severity,
    severityLabel: t.severityLabel,
    confidence: t.confidence,
    address: t.address,
    lat: t.lat,
    lng: t.lng,
    imageUrl: t.imageUrl,
    state: t.state,
    level: t.level,
    authorityId: t.authorityId,
    contractorId: t.contractorId,
    passes: t.passes,
    escalationCount: t.escalationCount ?? 0,
    ...ticketStanding(t),
    createdAt: new Date(t.createdAt).toISOString(),
    lastEscalatedAt: t.lastEscalatedAt ? new Date(t.lastEscalatedAt).toISOString() : null,
    atTopOfChain: nextLevel(t.level) === null,
  };
}

export interface IncomingRow {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  confidence: number;
  address: string | null;
  imageUrl: string;
  ticketId: string | null;
  createdAt: string;
}

export interface ConsoleData {
  configured: boolean;
  scope: string | null;
  scopeLabel: string;
  kpis: { open: number; escalated: number; awaitingVerification: number; closed: number; unowned: number };
  byState: { state: TicketState; count: number }[];
  bySeverity: { severity: Severity; count: number }[];
  needsYou: TicketRow[];
  mapPoints: TicketRow[];
  incoming: IncomingRow[];
  totalDefects: number;
}

export async function getConsole(scope: string | null): Promise<ConsoleData> {
  const scopeLabel = isConfigured() ? await scopeName(scope) : 'Everything reported';
  const empty: ConsoleData = {
    configured: false,
    scope,
    scopeLabel,
    kpis: { open: 0, escalated: 0, awaitingVerification: 0, closed: 0, unowned: 0 },
    byState: [],
    bySeverity: [],
    needsYou: [],
    mapPoints: [],
    incoming: [],
    totalDefects: 0,
  };
  if (!isConfigured()) return empty;

  try {
    const filter = await scopeFilter(scope);
    const [ticketCol, defectCol] = await Promise.all([tickets(), defects()]);

    const [open, escalated, awaiting, closed, unowned, stateRows, sevRows, needsYou, mapRows, incomingRows, totalDefects] =
      await Promise.all([
        ticketCol.countDocuments({ ...filter, state: { $in: OPEN } }),
        ticketCol.countDocuments({ ...filter, state: { $in: OPEN }, escalationCount: { $gt: 0 } }),
        ticketCol.countDocuments({ ...filter, state: 'repaired' }),
        ticketCol.countDocuments({ ...filter, state: { $in: ['verified', 'closed'] } }),
        ticketCol.countDocuments({ authorityId: null, state: { $in: OPEN } }),
        ticketCol
          .aggregate<{ _id: TicketState; count: number }>([
            { $match: filter },
            { $group: { _id: '$state', count: { $sum: 1 } } },
          ])
          .toArray(),
        ticketCol
          .aggregate<{ _id: Severity; count: number }>([
            { $match: { ...filter, state: { $in: OPEN } } },
            { $group: { _id: '$severity', count: { $sum: 1 } } },
          ])
          .toArray(),
        // Worst first: the ones that have climbed the chain, then the oldest.
        ticketCol
          .find({ ...filter, state: { $in: OPEN } })
          .sort({ escalationCount: -1, createdAt: 1 })
          .limit(8)
          .toArray(),
        ticketCol
          .find({ ...filter, state: { $in: OPEN }, location: { $ne: null } })
          .limit(300)
          .toArray(),
        defectCol.find({}).sort({ createdAt: -1 }).limit(10).toArray(),
        defectCol.countDocuments({}),
      ]);

    const stateOrder: TicketState[] = [
      'new', 'acknowledged', 'assigned', 'repaired', 'verified', 'closed', 'reopened',
    ];
    const sevOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'good'];
    const stateMap = new Map(stateRows.map((r) => [r._id, r.count]));
    const sevMap = new Map(sevRows.map((r) => [r._id, r.count]));

    return {
      configured: true,
      scope,
      scopeLabel,
      kpis: { open, escalated, awaitingVerification: awaiting, closed, unowned },
      byState: stateOrder.filter((s) => stateMap.get(s)).map((s) => ({ state: s, count: stateMap.get(s)! })),
      bySeverity: sevOrder.filter((s) => sevMap.get(s)).map((s) => ({ severity: s, count: sevMap.get(s)! })),
      needsYou: needsYou.map(toRow),
      mapPoints: mapRows.map(toRow),
      incoming: incomingRows.map(toIncoming),
      totalDefects,
    };
  } catch {
    return { ...empty, configured: true };
  }
}

function toIncoming(d: DefectDoc): IncomingRow {
  return {
    id: d._id,
    damageClass: d.damageClass,
    severity: d.severity,
    confidence: d.confidence,
    address: d.address,
    imageUrl: d.imageUrl,
    ticketId: d.ticketId ?? null,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

export interface QueueFilters {
  state?: TicketState[];
  severity?: Severity[];
  escalatedOnly?: boolean;
}

export async function getQueue(scope: string | null, filters: QueueFilters = {}, limit = 200) {
  if (!isConfigured()) return { configured: false, rows: [] as TicketRow[], total: 0 };
  try {
    const filter: Record<string, unknown> = { ...(await scopeFilter(scope)) };
    if (filters.state?.length) filter.state = { $in: filters.state };
    if (filters.severity?.length) filter.severity = { $in: filters.severity };
    if (filters.escalatedOnly) {
      filter.state = { $in: OPEN };
      filter.escalationCount = { $gt: 0 };
    }
    const col = await tickets();
    const [rows, total] = await Promise.all([
      col.find(filter).sort({ escalationCount: -1, createdAt: -1 }).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return { configured: true, rows: rows.map(toRow), total };
  } catch {
    return { configured: true, rows: [] as TicketRow[], total: 0 };
  }
}

export interface TicketDetail {
  ticket: TicketRow;
  events: (Omit<TicketEventDoc, 'at'> & { at: string })[];
  evidence: IncomingRow[];
  chain: { intact: boolean; brokenAtSeq: number | null; events: number };
  authority: AuthorityDoc | null;
  contractor: ContractorDoc | null;
  contractorOptions: ContractorDoc[];
  /** Every registered office, so forwarding can name where it goes. */
  authorityOptions: AuthorityDoc[];
}

export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  if (!isConfigured()) return null;
  const [ticketCol, eventCol, defectCol, authCol, contractorCol] = await Promise.all([
    tickets(), ticketEvents(), defects(), authorities(), contractors(),
  ]);
  const ticket = await ticketCol.findOne({ _id: id });
  if (!ticket) return null;

  const [events, evidence, chain, authority, contractor, contractorOptions, authorityOptions] =
    await Promise.all([
      eventCol.find({ ticketId: id }).sort({ seq: 1 }).toArray(),
      defectCol.find({ _id: { $in: ticket.defectIds } }).toArray(),
      verifyChain(id),
      ticket.authorityId ? authCol.findOne({ _id: ticket.authorityId }) : Promise.resolve(null),
      ticket.contractorId ? contractorCol.findOne({ _id: ticket.contractorId }) : Promise.resolve(null),
      contractorCol.find({}).sort({ name: 1 }).toArray(),
      authCol.find({}).toArray(),
    ]);

  return {
    ticket: toRow(ticket),
    events: events.map((e) => ({ ...e, at: new Date(e.at).toISOString() })),
    evidence: evidence.map(toIncoming),
    chain,
    authority,
    contractor,
    contractorOptions,
    // Most senior first: forwarding is usually upward, so the offices a ticket
    // is likely to be sent to should not be at the bottom of the list.
    authorityOptions: authorityOptions.sort(
      (a, b) =>
        LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level) || a.name.localeCompare(b.name),
    ),
  };
}

const LEVEL_ORDER: AuthorityLevel[] = [
  'public',
  'ward_engineer',
  'executive_engineer',
  'commissioner',
  'state_department',
];

/* ── contractors ───────────────────────────────────────────────────── */

export interface ContractorRow {
  id: string;
  name: string;
  panel: string | null;
  ratePerM2: number | null;
  since: number | null;
  openLoad: number;
  closed: number;
  reopened: number;
  medianDays: number | null;
}

export async function getContractors(): Promise<{ configured: boolean; rows: ContractorRow[] }> {
  if (!isConfigured()) return { configured: false, rows: [] };
  try {
    const [col, ticketCol] = await Promise.all([contractors(), tickets()]);
    const rows = await col.find({}).sort({ name: 1 }).toArray();
    const assigned = await ticketCol.find({ contractorId: { $ne: null } }).toArray();

    return {
      configured: true,
      rows: rows.map((c) => {
        const mine = assigned.filter((t) => t.contractorId === c._id);
        const done = mine.filter((t) => t.repairedAt);
        const days = done
          .map((t) => (new Date(t.repairedAt!).getTime() - new Date(t.assignedAt ?? t.createdAt).getTime()) / 86_400_000)
          .sort((a, b) => a - b);
        return {
          id: c._id,
          name: c.name,
          panel: c.panel,
          ratePerM2: c.ratePerM2,
          since: c.since,
          openLoad: mine.filter((t) => ['assigned', 'repaired'].includes(t.state)).length,
          closed: mine.filter((t) => ['verified', 'closed'].includes(t.state)).length,
          // Work that had to be done twice — the number that matters most.
          reopened: mine.filter((t) => t.state === 'reopened').length,
          medianDays: days.length
            ? Number(
                (days.length % 2
                  ? days[(days.length - 1) / 2]
                  : (days[days.length / 2 - 1] + days[days.length / 2]) / 2
                ).toFixed(1),
              )
            : null,
        };
      }),
    };
  } catch {
    return { configured: true, rows: [] };
  }
}

/* ── ward board (citizen side) ─────────────────────────────────────── */

export interface BoardRow {
  id: string;
  name: string;
  level: AuthorityLevel;
  open: number;
  escalated: number;
  fixed: number;
  reopened: number;
  medianFixDays: number | null;
}

export async function getBoard(): Promise<{ configured: boolean; rows: BoardRow[]; unassigned: number }> {
  if (!isConfigured()) return { configured: false, rows: [], unassigned: 0 };
  try {
    const [authCol, ticketCol] = await Promise.all([authorities(), tickets()]);
    const [auths, all] = await Promise.all([authCol.find({}).toArray(), ticketCol.find({}).toArray()]);

    const rows = auths.map((a) => {
      const mine = all.filter((t) => t.authorityId === a._id);
      const days = mine
        .filter((t) => t.repairedAt)
        .map((t) => (new Date(t.repairedAt!).getTime() - new Date(t.createdAt).getTime()) / 86_400_000)
        .sort((x, y) => x - y);
      return {
        id: a._id,
        name: a.name,
        level: a.level,
        open: mine.filter((t) => OPEN.includes(t.state)).length,
        escalated: mine.filter((t) => OPEN.includes(t.state) && (t.escalationCount ?? 0) > 0).length,
        fixed: mine.filter((t) => ['verified', 'closed'].includes(t.state)).length,
        reopened: mine.filter((t) => t.state === 'reopened').length,
        medianFixDays: days.length
          ? Number(
              (days.length % 2
                ? days[(days.length - 1) / 2]
                : (days[days.length / 2 - 1] + days[days.length / 2]) / 2
              ).toFixed(1),
            )
          : null,
      };
    });

    return {
      configured: true,
      rows: rows.sort((a, b) => b.escalated - a.escalated || b.open - a.open),
      unassigned: all.filter((t) => !t.authorityId && OPEN.includes(t.state)).length,
    };
  } catch {
    return { configured: true, rows: [], unassigned: 0 };
  }
}

/* ── detection quality ─────────────────────────────────────────────── */

export interface ModelStats {
  configured: boolean;
  uploads: { total: number; done: number; rejected: number; failed: number };
  defects: { total: number; ticketed: number; located: number; meanConfidence: number | null };
  byClass: { damageClass: DamageClass; count: number; meanConfidence: number }[];
  confidenceBands: { band: string; count: number }[];
  /** Frames the detector was run over, summed across finished jobs. */
  framesAnalysed: number;
}

export async function getModelStats(): Promise<ModelStats> {
  const empty: ModelStats = {
    configured: false,
    uploads: { total: 0, done: 0, rejected: 0, failed: 0 },
    defects: { total: 0, ticketed: 0, located: 0, meanConfidence: null },
    byClass: [],
    confidenceBands: [],
    framesAnalysed: 0,
  };
  if (!isConfigured()) return empty;

  try {
    const [defectCol, uploadCol] = await Promise.all([defects(), uploads()]);
    const [total, done, rejected, failed, defectTotal, ticketed, located, classRows, confRows, frames] =
      await Promise.all([
        uploadCol.countDocuments({}),
        uploadCol.countDocuments({ status: 'done' }),
        uploadCol.countDocuments({ status: 'rejected' }),
        uploadCol.countDocuments({ status: 'failed' }),
        defectCol.countDocuments({}),
        defectCol.countDocuments({ ticketId: { $ne: null } }),
        defectCol.countDocuments({ location: { $ne: null } }),
        defectCol
          .aggregate<{ _id: DamageClass; count: number; mean: number }>([
            { $group: { _id: '$damageClass', count: { $sum: 1 }, mean: { $avg: '$confidence' } } },
            { $sort: { count: -1 } },
          ])
          .toArray(),
        defectCol
          .aggregate<{ _id: number; count: number }>([
            { $bucket: { groupBy: '$confidence', boundaries: [0, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01], default: 0, output: { count: { $sum: 1 } } } },
          ])
          .toArray(),
        uploadCol
          .aggregate<{ _id: null; n: number }>([
            { $group: { _id: null, n: { $sum: { $ifNull: ['$summary.framesAnalysed', 0] } } } },
          ])
          .toArray(),
      ]);

    const meanAll = classRows.length
      ? classRows.reduce((n, r) => n + r.mean * r.count, 0) / classRows.reduce((n, r) => n + r.count, 0)
      : null;

    const bandLabel: Record<number, string> = {
      0: 'below 0.40', 0.4: '0.40–0.50', 0.5: '0.50–0.60', 0.6: '0.60–0.70',
      0.7: '0.70–0.80', 0.8: '0.80–0.90', 0.9: '0.90 and up',
    };

    return {
      configured: true,
      uploads: { total, done, rejected, failed },
      defects: {
        total: defectTotal,
        ticketed,
        located,
        meanConfidence: meanAll != null ? Number(meanAll.toFixed(3)) : null,
      },
      byClass: classRows.map((r) => ({
        damageClass: r._id,
        count: r.count,
        meanConfidence: Number(r.mean.toFixed(3)),
      })),
      confidenceBands: confRows.map((r) => ({ band: bandLabel[r._id] ?? String(r._id), count: r.count })),
      framesAnalysed: frames[0]?.n ?? 0,
    };
  } catch {
    return { ...empty, configured: true };
  }
}

/* ── deterioration ─────────────────────────────────────────────────── */

export interface DeteriorationRow {
  id: string;
  address: string | null;
  damageClass: DamageClass;
  from: Severity;
  to: Severity;
  passes: number;
  imageUrl: string;
  firstSeen: string;
  lastChange: string;
}

export interface DeteriorationData {
  configured: boolean;
  worsening: DeteriorationRow[];
  repeatSightings: TicketRow[];
  /** Streets with more than one reported defect. */
  clusters: { address: string; count: number; worst: Severity }[];
  totalTickets: number;
}

export async function getDeterioration(scope: string | null): Promise<DeteriorationData> {
  if (!isConfigured()) {
    return { configured: false, worsening: [], repeatSightings: [], clusters: [], totalTickets: 0 };
  }
  try {
    const filter = await scopeFilter(scope);
    const [ticketCol, defectCol] = await Promise.all([tickets(), defects()]);
    const [all, clusterRows] = await Promise.all([
      ticketCol.find(filter).toArray(),
      defectCol
        .aggregate<{ _id: string; count: number; severities: Severity[] }>([
          { $match: { address: { $ne: null } } },
          { $group: { _id: '$address', count: { $sum: 1 }, severities: { $push: '$severity' } } },
          { $match: { count: { $gt: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ]);

    const rank: Record<Severity, number> = { good: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const worsening = all
      .filter((t) => (t.severityHistory?.length ?? 0) > 1)
      .map((t) => {
        const h = t.severityHistory!;
        return {
          id: t._id,
          address: t.address,
          damageClass: t.damageClass,
          from: h[0].severity,
          to: h[h.length - 1].severity,
          passes: t.passes,
          imageUrl: t.imageUrl,
          firstSeen: new Date(t.createdAt).toISOString(),
          lastChange: new Date(h[h.length - 1].at).toISOString(),
        };
      })
      .sort((a, b) => rank[b.to] - rank[a.to]);

    return {
      configured: true,
      worsening,
      repeatSightings: all.filter((t) => t.passes > 1).sort((a, b) => b.passes - a.passes).slice(0, 12).map(toRow),
      clusters: clusterRows.map((c) => ({
        address: c._id,
        count: c.count,
        worst: c.severities.reduce((w, s) => (rank[s] > rank[w] ? s : w), 'good' as Severity),
      })),
      totalTickets: all.length,
    };
  } catch {
    return { configured: true, worsening: [], repeatSightings: [], clusters: [], totalTickets: 0 };
  }
}
