import type { AuditEvent, DamageClass, Ticket } from '@/lib/types';

export interface QueueRow {
  id: string;
  location: string;
  damageClass: DamageClass;
  damageLabel: string;
  confidence: number;
  passes: number;
  sittingWith: string;
  daysOver?: number;
  daysLeft?: number;
  contractor?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  state: 'new' | 'acknowledged' | 'assigned' | 'verifying' | 'reopened';
}

export const QUEUE: QueueRow[] = [
  { id: 'GMC-W32-2461', location: 'G.S. Road, Ganeshguri flyover', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.94, passes: 46, sittingWith: 'Executive Engineer', daysOver: 9, priority: 'critical', state: 'new' },
  { id: 'GMC-W32-2455', location: 'Rukminigaon main road', damageClass: 'pothole', damageLabel: 'Pothole cluster', confidence: 0.91, passes: 31, sittingWith: 'Ward Engineer', daysOver: 7, priority: 'high', state: 'new' },
  { id: 'GMC-W32-2470', location: 'Survey Chariali service lane', damageClass: 'alligator', damageLabel: 'Alligator crack', confidence: 0.88, passes: 12, sittingWith: 'Ward Engineer', daysLeft: 1, contractor: 'Luit Roadworks', priority: 'high', state: 'assigned' },
  { id: 'GMC-W32-2472', location: 'Ganeshguri to Six Mile stretch', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.93, passes: 54, sittingWith: 'Ward Engineer', daysLeft: 2, contractor: 'Luit Roadworks', priority: 'high', state: 'assigned' },
  { id: 'GMC-W32-2474', location: 'Hengrabari Road, IOC point', damageClass: 'transverse', damageLabel: 'Transverse crack', confidence: 0.67, passes: 8, sittingWith: 'Ward Engineer', daysLeft: 4, contractor: 'Kamrup Constructions', priority: 'high', state: 'assigned' },
  { id: 'GMC-W32-2478', location: 'Dispur Last Gate approach', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.89, passes: 22, sittingWith: 'Ward Engineer', daysLeft: 5, priority: 'high', state: 'acknowledged' },
  { id: 'GMC-W32-2481', location: 'Sixmile flyover down-ramp', damageClass: 'alligator', damageLabel: 'Alligator crack', confidence: 0.84, passes: 17, sittingWith: 'Ward Engineer', daysLeft: 6, contractor: 'Brahmaputra Infra', priority: 'high', state: 'assigned' },
  { id: 'GMC-W32-2483', location: 'Bhangagarh hospital gate', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.96, passes: 63, sittingWith: 'Ward Engineer', daysLeft: 2, priority: 'critical', state: 'acknowledged' },
  { id: 'GMC-W32-2486', location: 'Rukminigaon lane 4', damageClass: 'edge_break', damageLabel: 'Edge break', confidence: 0.71, passes: 6, sittingWith: 'Ward Engineer', daysLeft: 8, contractor: 'Kamrup Constructions', priority: 'high', state: 'assigned' },
  { id: 'GMC-W32-2489', location: 'Ganeshguri market approach', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.9, passes: 28, sittingWith: 'Ward Engineer', daysLeft: 9, priority: 'critical', state: 'acknowledged' },
  { id: 'GMC-W32-2491', location: 'Zoo Road Tiniali', damageClass: 'longitudinal', damageLabel: 'Longitudinal crack', confidence: 0.63, passes: 5, sittingWith: 'Ward Engineer', daysLeft: 11, priority: 'high', state: 'new' },
  { id: 'GMC-W32-2499', location: 'Rukminigaon lane 9', damageClass: 'pothole', damageLabel: 'Pothole', confidence: 0.85, passes: 14, sittingWith: 'Ward Engineer', daysLeft: 13, contractor: 'Dihing Civil Works', priority: 'high', state: 'assigned' },
];

export const NEEDS_YOU = [
  { days: 9, unit: 'days over', road: 'G.S. Road, before Ganeshguri flyover', note: 'Escalated to you 3 days ago', id: 'GMC-W32-2461', tone: 'red' as const },
  { days: 7, unit: 'days over', road: 'Rukminigaon main road', note: 'Acknowledge deadline passed', id: 'GMC-W32-2455', tone: 'red' as const },
  { days: 1, unit: 'day left', road: 'Survey Chariali service lane', note: 'Fix due tomorrow', id: 'GMC-W32-2470', tone: 'amber' as const },
];

export const INCOMING = [
  { at: '09:41', road: 'G.S. Road, Ganeshguri', klass: 'Pothole', vehicles: 4, conf: '.94' },
  { at: '09:38', road: 'R.G. Baruah Rd, Zoo gate', klass: 'Alligator crack', vehicles: 2, conf: '.88' },
  { at: '09:36', road: 'Rukminigaon main road', klass: 'Pothole', vehicles: 6, conf: '.91' },
  { at: '09:31', road: 'Lokhra Rd, Bharalu bridge', klass: 'Edge break', vehicles: 2, conf: '.72' },
];

/** Extra rows the live feed on A1 pushes in during the demo. */
export const INCOMING_STREAM = [
  { road: 'Six Mile Link, near flyover', klass: 'Pothole', vehicles: 3, conf: '.90' },
  { road: 'Beltola Road, market stretch', klass: 'Alligator crack', vehicles: 5, conf: '.86' },
  { road: 'G.S. Road, Dispur Last Gate', klass: 'Pothole', vehicles: 2, conf: '.93' },
  { road: 'Hengrabari Road, IOC point', klass: 'Transverse crack', vehicles: 2, conf: '.68' },
  { road: 'Kahilipara Road, water tank', klass: 'Longitudinal crack', vehicles: 4, conf: '.77' },
  { road: 'Zoo Road Tiniali', klass: 'Pothole', vehicles: 7, conf: '.95' },
];

export const TICKET: Ticket = {
  id: 'GMC-W32-2461',
  eventId: 'EV-88213',
  location: 'Pothole on G.S. Road, before Ganeshguri flyover',
  chainage: '2.140 km',
  coordinates: { lat: 26.1445, lng: 91.7898 },
  damageClass: 'pothole',
  confidence: 0.94,
  passes: 46,
  severity: 0.91,
  severityFactors: [
    { label: 'Damage class · pothole', value: 0.95 },
    { label: 'Size · 0.9 m × 0.4 m, 210 mm deep', value: 0.88 },
    { label: 'Road class · arterial', value: 0.8 },
    { label: 'Traffic · 41,000 vehicles a day', value: 0.92 },
    { label: 'Near a hospital gate, 180 m', value: 1.0 },
  ],
  state: 'new',
  level: 'executive_engineer',
  authorityId: 'z3',
  slaAckDue: '2026-08-26T07:12:00+05:30',
  slaFixDue: '2026-09-02T07:12:00+05:30',
  daysOver: 9,
  createdAt: '2026-08-24T07:12:00+05:30',
  updatedAt: '2026-09-02T08:14:00+05:30',
  estimate: {
    areaM2: 3.6,
    ratePerM2: 12800,
    total: 46200,
    warrantyUntil: '02 Mar 2027',
  },
  followers: 46,
  vehiclesPerDay: 1140,
  nearbyOpen: 3,
  evidence: [
    { url: '', capturedAt: '24 Aug · 07:12', confidence: 0.9 },
    { url: '', capturedAt: '27 Aug · 21:04', confidence: 0.87, night: true },
    { url: '', capturedAt: '31 Aug · 08:40', confidence: 0.92 },
    { url: '', capturedAt: '02 Sep · 08:14', confidence: 0.94 },
  ],
};

export const AUDIT: AuditEvent[] = [
  { id: 'a1', ticketId: 'GMC-W32-2461', action: 'Ticket raised automatically', actor: 'System · 12 independent passes', at: '24 Aug, 07:12', hash: '8f2a…c41d', prevHash: '—', tone: 'good' },
  { id: 'a2', ticketId: 'GMC-W32-2461', action: 'Routed to Ward 32 engineer', actor: 'Jurisdiction layer, GMC', at: '24 Aug, 07:12', hash: 'b19e…7a02', prevHash: '8f2a…c41d', tone: 'good' },
  { id: 'a3', ticketId: 'GMC-W32-2461', action: 'Acknowledgement deadline missed', actor: 'SLA engine', at: '26 Aug, 07:12', hash: 'd4c7…19bb', prevHash: 'b19e…7a02', tone: 'bad' },
  { id: 'a4', ticketId: 'GMC-W32-2461', action: 'Escalated to Executive Engineer', actor: 'SLA engine · level 2', at: '26 Aug, 07:12', hash: '22f0…8e56', prevHash: 'd4c7…19bb', tone: 'warn' },
  { id: 'a5', ticketId: 'GMC-W32-2461', action: 'Breach published on public board', actor: 'Public dashboard', at: '26 Aug, 07:15', hash: '9a31…44de', prevHash: '22f0…8e56', tone: 'bad' },
  { id: 'a6', ticketId: 'GMC-W32-2461', action: 'Acknowledged', actor: 'S. Das, Executive Engineer', at: '28 Aug, 11:40', hash: 'cc85…2f19', prevHash: '9a31…44de', tone: 'good' },
  { id: 'a7', ticketId: 'GMC-W32-2461', action: 'Repair deadline missed', actor: 'SLA engine', at: '02 Sep, 07:12', hash: '70bd…6c33', prevHash: 'cc85…2f19', tone: 'bad' },
];

/** Citizen-facing view of the tickets a person follows (C1, C5). */
export const FOLLOWED = [
  { id: 'GMC-W32-2461', where: 'G.S. Road · Ganeshguri', status: 'Escalated to Executive Engineer', tone: 'red' as const, sla: 'Day 9 of 7' },
  { id: 'GMC-W31-2388', where: 'Zoo Road · near Tiniali', status: 'Contractor assigned', tone: 'amber' as const, sla: 'Day 3 of 7' },
  { id: 'PWD-KAM-0914', where: 'Beltola Road · Survey point', status: 'Fixed, waiting for 2 more passes', tone: 'blue' as const, sla: 'Day 6 of 7' },
  { id: 'GMC-W28-2205', where: 'Lokhra Road · Bharalu bridge', status: 'Closed, road verified clean', tone: 'green' as const, sla: 'Closed 22 Aug' },
  { id: 'GMC-W32-2109', where: 'Hengrabari Road · IOC point', status: 'Closed, road verified clean', tone: 'green' as const, sla: 'Closed 14 Aug' },
  { id: 'NHAI-27-4471', where: 'NH-27 · km 12.480', status: 'Reopened, damage returned', tone: 'red' as const, sla: 'Contractor flagged' },
];

export const MY_REPORTS = [
  { id: 'GMC-W32-2461', where: 'G.S. Road · Ganeshguri', klass: 'Pothole', sent: '24 Aug', status: 'Escalated · Executive Engineer', tone: 'red' as const, sla: 'overdue by 2 days', kind: 'pothole' as const },
  { id: 'GMC-W31-2388', where: 'Zoo Road · near Tiniali', klass: 'Alligator crack', sent: '30 Aug', status: 'Contractor assigned', tone: 'amber' as const, sla: '4 days left', kind: 'alligator' as const },
  { id: 'PWD-KAM-0914', where: 'Beltola Road · Survey', klass: 'Pothole', sent: '28 Aug', status: 'Repaired, awaiting 2 clean passes', tone: 'blue' as const, sla: 'verifying', kind: 'repaired' as const },
  { id: 'GMC-W28-2205', where: 'Lokhra Road · Bharalu', klass: 'Edge break', sent: '12 Aug', status: 'Closed, road verified clean', tone: 'green' as const, sla: 'closed in 9 days', kind: 'repaired' as const },
  { id: 'GMC-W32-2109', where: 'Hengrabari Road', klass: 'Transverse crack', sent: '06 Aug', status: 'Closed, road verified clean', tone: 'green' as const, sla: 'closed in 6 days', kind: 'repaired' as const },
  { id: 'NHAI-27-4471', where: 'NH-27 · km 12.480', klass: 'Pothole cluster', sent: '02 Aug', status: 'Reopened, damage came back', tone: 'red' as const, sla: 'contractor flagged', kind: 'pothole' as const },
];
