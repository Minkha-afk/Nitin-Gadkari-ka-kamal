/** Command centre — live ticket state for the current jurisdiction. */

import ConsoleClient from '@/components/authority/ConsoleClient';
import { getConsole, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function ConsolePage() {
  const data = await getConsole(await selectedScope());
  return <ConsoleClient data={data} />;
}
