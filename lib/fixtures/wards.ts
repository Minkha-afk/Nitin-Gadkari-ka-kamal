import type { Ward } from '@/lib/types';

export const WARDS: Ward[] = [
  { id: 'w32', name: 'Ward 32 · Dispur', score: 41, open: 62, breached: 9 },
  { id: 'w31', name: 'Ward 31 · Ganeshguri', score: 54, open: 48, breached: 6 },
  { id: 'w28', name: 'Ward 28 · Beltola', score: 63, open: 39, breached: 3 },
  { id: 'w14', name: 'Ward 14 · Chandmari', score: 78, open: 21, breached: 1 },
];

export const CITY = {
  score: 58,
  open: 1204,
  sensedKm: 2380,
  vehicles: 1842,
  fixedThisMonth: 386,
  breaches: 74,
  medianFixDays: 13,
};
