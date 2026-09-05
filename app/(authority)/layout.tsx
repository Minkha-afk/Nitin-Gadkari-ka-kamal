/**
 * Authority shell. A server component so the jurisdiction tree and the current
 * scope are read from the database once, rather than fetched by the chrome.
 */

import AuthorityShell from '@/components/chrome/AuthorityShell';
import { getAuthorityTree, scopeName, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const [tree, scope] = await Promise.all([getAuthorityTree(), selectedScope()]);
  return (
    <AuthorityShell tree={tree} scope={scope} scopeLabel={await scopeName(scope)}>
      {children}
    </AuthorityShell>
  );
}
