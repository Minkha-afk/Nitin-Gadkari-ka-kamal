/**
 * Who a ticket sits with, and who is above them.
 *
 * There is no clock in here on purpose. A ticket reaches its authority the
 * moment it is opened, and it only climbs when a person decides it should —
 * "forward to higher ups" is an act someone signs, not a deadline expiring.
 * A deadline that moves work on its own is only defensible if the deadline
 * itself is; this system does not claim to know one.
 */

import type { AuthorityLevel, Severity } from './types';

/** Severities that open a ticket the moment they are detected. */
export const AUTO_TICKET: Severity[] = ['critical', 'high'];

/** The chain a ticket can be forwarded up, most local first. */
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
