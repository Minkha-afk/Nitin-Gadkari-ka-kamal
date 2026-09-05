import type { AuthorityLevel } from '@/lib/types';

export interface TreeNode {
  id: string;
  name: string;
  count: number;
  depth: number;
}

export const JURISDICTION: TreeNode[] = [
  { id: 'gmc', name: 'Guwahati Municipal Corporation', count: 1204, depth: 0 },
  { id: 'z3', name: 'Zone 3 · Dispur', count: 412, depth: 1 },
  { id: 'w32', name: 'Ward 32 · Dispur', count: 62, depth: 2 },
  { id: 'w31', name: 'Ward 31 · Ganeshguri', count: 48, depth: 2 },
  { id: 'w28', name: 'Ward 28 · Beltola', count: 39, depth: 2 },
  { id: 'pwd', name: 'PWD Kamrup (Metro)', count: 186, depth: 0 },
  { id: 'nhai', name: 'NHAI · NH-27 stretch', count: 44, depth: 0 },
];

export interface Role {
  id: AuthorityLevel;
  name: string;
  scope: string;
  initials: string;
  person: string;
  breadcrumb: string[];
  selected: string;
  /** ids of jurisdiction rows visible at this role */
  visible: string[];
  queue: number;
  kpi: { open: number; breached: number; verifying: number; closed: number; health: number };
}

export const ROLES: Role[] = [
  {
    id: 'ward_engineer',
    name: 'Ward Engineer',
    scope: 'Ward 32 · Dispur',
    initials: 'RB',
    person: 'R. Bhuyan',
    breadcrumb: ['Guwahati Municipal Corporation', 'Zone 3', 'Ward 32'],
    selected: 'w32',
    visible: ['gmc', 'z3', 'w32', 'w31', 'w28', 'pwd', 'nhai'],
    queue: 44,
    kpi: { open: 62, breached: 6, verifying: 8, closed: 23, health: 41 },
  },
  {
    id: 'executive_engineer',
    name: 'Executive Engineer',
    scope: 'GMC Zone 3',
    initials: 'SD',
    person: 'S. Das',
    breadcrumb: ['Guwahati Municipal Corporation', 'Zone 3'],
    selected: 'z3',
    visible: ['gmc', 'z3', 'w32', 'w31', 'w28', 'pwd', 'nhai'],
    queue: 149,
    kpi: { open: 412, breached: 31, verifying: 24, closed: 118, health: 52 },
  },
  {
    id: 'commissioner',
    name: 'Municipal Commissioner',
    scope: 'GMC head office',
    initials: 'AK',
    person: 'A. Kalita',
    breadcrumb: ['Guwahati Municipal Corporation'],
    selected: 'gmc',
    visible: ['gmc', 'z3', 'w32', 'w31', 'w28', 'pwd', 'nhai'],
    queue: 386,
    kpi: { open: 1204, breached: 74, verifying: 61, closed: 386, health: 58 },
  },
];
