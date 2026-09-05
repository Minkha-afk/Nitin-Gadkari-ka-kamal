/**
 * Where a ticket stands — without a deadline to stand against.
 *
 * The old reading was "how long until the SLA is breached". There is no SLA
 * any more, so the honest replacement is the pair of facts an office can
 * actually be asked about: how long the ticket has been sitting there, and
 * whether somebody has already pushed it up the chain.
 */

import type { Severity } from './types';

export type Urgency = 'settled' | 'escalated' | 'attention' | 'open';

export interface TicketStanding {
  urgency: Urgency;
  /** Has it been forwarded to a higher authority at least once? */
  escalated: boolean;
  /** Just the amount, ready to print next to a unit: "40 min", "6 h", "3 d". */
  ageValue: string;
  /** Ready to print on its own: "6 h open", "3 d open", "settled". */
  ageLabel: string;
  ageHours: number;
  ageDays: number;
}

const SETTLED = ['repaired', 'verified', 'closed'];
const LOUD: Severity[] = ['critical', 'high'];

export function ticketStanding(
  ticket: { createdAt: Date | string; state: string; severity?: Severity; escalationCount?: number },
  now = new Date(),
): TicketStanding {
  const hours = Math.max(0, (now.getTime() - new Date(ticket.createdAt).getTime()) / 3_600_000);
  const escalated = (ticket.escalationCount ?? 0) > 0;
  const value = amount(hours);
  const base = { escalated, ageValue: value, ageHours: Math.floor(hours), ageDays: Math.floor(hours / 24) };

  if (SETTLED.includes(ticket.state)) {
    return { ...base, urgency: 'settled', ageLabel: 'settled' };
  }
  const urgency: Urgency = escalated
    ? 'escalated'
    : LOUD.includes(ticket.severity ?? 'low')
      ? 'attention'
      : 'open';
  return { ...base, urgency, ageLabel: `${value} open` };
}

function amount(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}
