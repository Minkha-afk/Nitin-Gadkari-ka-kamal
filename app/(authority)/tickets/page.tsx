/** Ticket queue for the current jurisdiction. */

import QueueClient from '@/components/authority/QueueClient';
import { getQueue, scopeName, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const scope = await selectedScope();
  const [{ rows, total, configured }, label] = await Promise.all([getQueue(scope), scopeName(scope)]);
  return <QueueClient rows={rows} total={total} configured={configured} scopeLabel={label} />;
}
