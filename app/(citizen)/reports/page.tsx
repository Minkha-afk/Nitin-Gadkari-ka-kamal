/**
 * My reports — scoped to the rs_device cookie, read server-side.
 */

import ReportsClient from '@/components/citizen/ReportsClient';
import { deviceId } from '@/lib/device';
import { getMyReports } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const data = await getMyReports(await deviceId());
  return <ReportsClient data={data} />;
}
