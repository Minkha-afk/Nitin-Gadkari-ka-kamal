/**
 * Citizen home — a server component, so the database is read in-process rather
 * than by our own page calling our own API over HTTP.
 *
 * force-dynamic because the numbers change with every upload; a page baked at
 * build time would show the state of the world when the build ran.
 */

import CitizenHome from '@/components/citizen/CitizenHome';
import { getOverview } from '@/lib/overview';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const overview = await getOverview();
  return <CitizenHome overview={overview} />;
}
