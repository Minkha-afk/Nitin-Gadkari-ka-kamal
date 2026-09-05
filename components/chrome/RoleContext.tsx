'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { ROLES, type Role } from '@/lib/fixtures/authorities';

interface RoleCtx {
  role: Role;
  setRoleId: (id: string) => void;
}

const Ctx = createContext<RoleCtx>({ role: ROLES[0], setRoleId: () => {} });
export const useRole = () => useContext(Ctx);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(ROLES[0].id as string);
  const value = useMemo(
    () => ({ role: ROLES.find((r) => r.id === id) ?? ROLES[0], setRoleId: setId }),
    [id],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
