/**
 * Ward board — how each authority is actually doing on the tickets it owns.
 */

import BoardClient from '@/components/citizen/BoardClient';
import { getBoard } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const { rows, unassigned, configured } = await getBoard();
  return <BoardClient rows={rows} unassigned={unassigned} configured={configured} />;
}
