import type { Contractor, WorkOrder } from '@/lib/types';

export const CONTRACTORS: Contractor[] = [
  {
    id: 'luit',
    name: 'Luit Roadworks',
    panel: 'GMC empanelled',
    since: 2019,
    jobsClosed: 24,
    cameBack: 1,
    reliability: 0.86,
    medianDays: 6.2,
    ratePerM2: 12800,
    openLoad: 22,
    flagged: false,
  },
  {
    id: 'kamrup',
    name: 'Kamrup Constructions',
    panel: 'GMC empanelled',
    since: 2016,
    jobsClosed: 41,
    cameBack: 4,
    reliability: 0.79,
    medianDays: 8.4,
    ratePerM2: 11900,
    openLoad: 17,
    flagged: true,
  },
  {
    id: 'brahma',
    name: 'Brahmaputra Infra',
    panel: 'PWD panel',
    since: 2021,
    jobsClosed: 18,
    cameBack: 5,
    reliability: 0.54,
    medianDays: 11.6,
    ratePerM2: 13400,
    openLoad: 9,
    flagged: true,
  },
  {
    id: 'dihing',
    name: 'Dihing Civil Works',
    panel: 'GMC empanelled',
    since: 2022,
    jobsClosed: 12,
    cameBack: 0,
    reliability: 0.91,
    medianDays: 5.4,
    ratePerM2: 12600,
    openLoad: 6,
    flagged: false,
  },
];

export const WORK_ORDERS: (WorkOrder & { contractorName: string; tone: string })[] = [
  {
    id: 'WO-2026-0418',
    ticketId: 'GMC-W32-2461',
    location: 'G.S. Road, Ganeshguri',
    areaM2: 3.6,
    contractorId: 'luit',
    contractorName: 'Luit Roadworks',
    amount: 46200,
    state: 'Awaiting start',
    tone: 'amber',
  },
  {
    id: 'WO-2026-0417',
    ticketId: 'GMC-W32-2470',
    location: 'Survey Chariali',
    areaM2: 8.1,
    contractorId: 'luit',
    contractorName: 'Luit Roadworks',
    amount: 103700,
    state: 'Repaired, verifying',
    tone: 'blue',
  },
  {
    id: 'WO-2026-0414',
    ticketId: 'GMC-W31-2402',
    location: 'Zoo Road Tiniali',
    areaM2: 5.4,
    contractorId: 'nilachal',
    contractorName: 'Nilachal Builders',
    amount: 65300,
    state: 'Closed and verified',
    tone: 'green',
  },
  {
    id: 'WO-2026-0409',
    ticketId: 'NHAI-27-4471',
    location: 'NH-27, km 12.480',
    areaM2: 11.2,
    contractorId: 'brahma',
    contractorName: 'Brahmaputra Infra',
    amount: 150100,
    state: 'Reopened in warranty',
    tone: 'red',
  },
  {
    id: 'WO-2026-0405',
    ticketId: 'GMC-W32-2483',
    location: 'Bhangagarh hospital gate',
    areaM2: 4.2,
    contractorId: 'kamrup',
    contractorName: 'Kamrup Constructions',
    amount: 49980,
    state: 'Repaired, verifying',
    tone: 'blue',
  },
];

/** Indian digit grouping, e.g. 103700 → 1,03,700 */
export function inr(n: number) {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}
