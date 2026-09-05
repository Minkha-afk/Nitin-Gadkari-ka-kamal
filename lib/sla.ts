/**
 * Service-level policy: how long an authority has to answer, by severity.
 *
 * These are explicit constants rather than a learned model or a hidden config,
 * for the same reason the severity thresholds are: a deadline that decides who
 * gets escalated has to be defensible in a review, and "the model said so" is
 * not defensible.
 *
 * Hours, not days, so a demo can use a short clock without changing the shape.
 */

import type { AuthorityLevel, Severity } from './types';

export interface SlaPolicy {
  /** Hours to acknowledge the ticket exists. */
  ackHours: number;
  /** Hours to have it repaired. */
  fixHours: number;
}

export const SLA: Record<Severity, SlaPolicy | null> = {
  critical: { ackHours: 24, fixHours: 72 },
  high: { ackHours: 48, fixHours: 168 },
  medium: { ackHours: 72, fixHours: 360 },
  low: { ackHours: 120, fixHours: 720 },
  // No visible damage is not work. It never becomes a ticket.
  good: null,
};

/** Severities that open a ticket without anyone asking. */
export const AUTO_TICKET: Severity[] = ['critical', 'high'];

/** The chain a ticket climbs when nobody acknowledges it. */
export const ESCALATION: AuthorityLevel[] = [
  'ward_engineer',
  'executive_engineer',
  'commissioner',
  'state_department',
];

export function nextLevel(level: AuthorityLevel): AuthorityLevel | null {
  const i = ESCALATION.indexOf(level);
  return i < 0 || i === ESCALATION.length - 1 ? null : ESCALATION[i + 1];
}

export function dueDates(severity: Severity, from: Date) {
  const policy = SLA[severity] ?? SLA.low!;
  return {
    slaAckDue: new Date(from.getTime() + policy.ackHours * 3_600_000),
    slaFixDue: new Date(from.getTime() + policy.fixHours * 3_600_000),
  };
}

/** Whole days over the deadline, or days remaining. Never both. */
export function slaStanding(ticket: { slaFixDue: Date | string; state: string }, now = new Date()) {
  const due = new Date(ticket.slaFixDue).getTime();
  const settled = ['repaired', 'verified', 'closed'].includes(ticket.state);
  const diffDays = (due - now.getTime()) / 86_400_000;
  if (settled) return { daysOver: undefined, daysLeft: undefined, breached: false };
  return diffDays < 0
    ? { daysOver: Math.floor(-diffDays), daysLeft: undefined, breached: true }
    : { daysOver: undefined, daysLeft: Math.ceil(diffDays), breached: false };
}
