/**
 * Escalation ladder — what has climbed, and what could.
 *
 * Nothing climbs on a timer. A ticket moves up when somebody here decides the
 * office holding it is not answering and forwards it, which is why the action
 * lives on this page rather than in a cron job nobody sees.
 */

import EscalationsClient from '@/components/authority/EscalationsClient';
import { getAuthorityTree, getQueue, scopeName, selectedScope, SETTLED } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function EscalationsPage() {
  const scope = await selectedScope();
  const [{ rows, configured }, label, tree] = await Promise.all([
    getQueue(scope),
    scopeName(scope),
    getAuthorityTree(),
  ]);
  const open = rows.filter((r) => !SETTLED.includes(r.state));
  return (
    <EscalationsClient
      escalated={open.filter((r) => r.escalated)}
      waiting={open.filter((r) => !r.escalated)}
      authorities={tree.nodes}
      configured={configured}
      scopeLabel={label}
    />
  );
}
