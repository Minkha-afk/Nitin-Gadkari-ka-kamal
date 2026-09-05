'use client';

/**
 * Which authority you are looking as.
 *
 * The list is whatever is registered in the database — there are no seeded
 * roles, because a ward office is a real organisation and inventing one would
 * be inventing data. The choice lives in a cookie so server components can read
 * it, and switching refreshes the tree rather than filtering on the client.
 *
 * This is a scope switcher, not a login: it changes what you are looking at,
 * it does not prove who you are. Every action still names its actor.
 */

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthorityTree } from '@/lib/authority';

export const SCOPE_COOKIE = 'rs_authority';

interface ScopeCtx {
  tree: AuthorityTree;
  scope: string | null;
  scopeLabel: string;
  setScope: (id: string) => void;
}

const Ctx = createContext<ScopeCtx>({
  tree: { configured: false, nodes: [], unassignedOpen: 0, totalOpen: 0 },
  scope: null,
  scopeLabel: 'Everything reported',
  setScope: () => {},
});

export const useScope = () => useContext(Ctx);

export function ScopeProvider({
  tree,
  scope,
  scopeLabel,
  children,
}: {
  tree: AuthorityTree;
  scope: string | null;
  scopeLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function setScope(id: string) {
    document.cookie = `${SCOPE_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return <Ctx.Provider value={{ tree, scope, scopeLabel, setScope }}>{children}</Ctx.Provider>;
}
