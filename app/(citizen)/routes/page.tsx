/**
 * Route comparison. Server component: the "worst stretches" list is a database
 * aggregation, so it is read in-process and handed to the client component that
 * does the interactive comparing.
 */

import RoutesClient from '@/components/citizen/RoutesClient';
import { getStretches } from '@/lib/overview';

export const dynamic = 'force-dynamic';

export default async function RoutesPage() {
  const stretches = await getStretches(10);
  return <RoutesClient stretches={stretches} />;
}
