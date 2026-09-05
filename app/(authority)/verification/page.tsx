/**
 * Verification queue — work a contractor says is finished, waiting for somebody
 * other than the contractor to agree.
 */

import VerificationClient from '@/components/authority/VerificationClient';
import { getQueue, scopeName, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const scope = await selectedScope();
  const [{ rows, configured }, label] = await Promise.all([getQueue(scope), scopeName(scope)]);
  return (
    <VerificationClient
      awaiting={rows.filter((r) => r.state === 'repaired')}
      verified={rows.filter((r) => r.state === 'verified')}
      reopened={rows.filter((r) => r.state === 'reopened')}
      configured={configured}
      scopeLabel={label}
    />
  );
}
