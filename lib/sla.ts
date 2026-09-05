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
  critical: { ackHours: 1, fixHours: 6 },
  high: { ackHours: 2, fixHours: 12 },
  medium: { ackHours: 6, fixHours: 24 },
  low: { ackHours: 12, fixHours: 48 },
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

export type Urgency = 'settled' | 'breached' | 'soon' | 'ok';

export interface SlaStanding {
  breached: boolean;
  urgency: Urgency;
  /** Ready to print: "40 min left", "3 h over", "2 d left". */
  dueLabel: string;
  hoursOver?: number;
  hoursLeft?: number;
  daysOver?: number;
  daysLeft?: number;
}

/**
 * Where a ticket stands against its fix deadline.
 *
 * These windows are hours, not days, so "3 days left" would round every live
 * ticket to the same useless number. The label picks its own unit, and urgency
 * is a fraction of the window rather than a fixed cutoff: six hours left is
 * comfortable on a 48-hour low, and already past the whole window on a
 * six-hour critical.
 */
export function slaStanding(
  ticket: { slaFixDue: Date | string; state: string; severity?: Severity },
  now = new Date(),
): SlaStanding {
  const settled = ['repaired', 'verified', 'closed'].includes(ticket.state);
  if (settled) return { breached: false, urgency: 'settled', dueLabel: 'settled' };

  const msLeft = new Date(ticket.slaFixDue).getTime() - now.getTime();
  const hours = Math.abs(msLeft) / 3_600_000;

  if (msLeft < 0) {
    return {
      breached: true,
      urgency: 'breached',
      dueLabel: `${amount(hours)} over`,
      hoursOver: Math.floor(hours),
      daysOver: Math.floor(hours / 24),
    };
  }

  const window = (SLA[ticket.severity ?? 'low'] ?? SLA.low!).fixHours;
  return {
    breached: false,
    urgency: hours <= window * 0.25 ? 'soon' : 'ok',
    dueLabel: `${amount(hours)} left`,
    hoursLeft: Math.ceil(hours),
    daysLeft: Math.ceil(hours / 24),
  };
}

function amount(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}
