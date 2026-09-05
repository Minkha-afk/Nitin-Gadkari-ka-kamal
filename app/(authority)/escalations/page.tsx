/**
 * Escalation ladder — what has climbed, and what is about to.
 *
 * A ticket escalates when its acknowledge deadline passes unanswered. Running
 * the escalation pass is a button here rather than a background job, so the
 * step is visible and auditable during a demo; in production it belongs on a
 * cron hitting the same endpoint.
 */

import EscalationsClient from '@/components/authority/EscalationsClient';
import { getQueue, scopeName, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function EscalationsPage() {
  const scope = await selectedScope();
  const [{ rows, configured }, label] = await Promise.all([getQueue(scope), scopeName(scope)]);
  const escalated = rows.filter((r) => r.escalationCount > 0);
  const breached = rows.filter((r) => r.daysOver != null);
  const dueSoon = rows.filter((r) => r.daysOver == null && r.daysLeft != null && r.daysLeft <= 2);
  return (
    <EscalationsClient
      escalated={escalated}
      breached={breached}
      dueSoon={dueSoon}
      configured={configured}
      scopeLabel={label}
    />
  );
}
