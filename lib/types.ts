export type DamageClass = 'pothole' | 'alligator' | 'longitudinal' | 'transverse' | 'edge_break';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'good';
export type TicketState =
  | 'new'
  | 'acknowledged'
  | 'assigned'
  | 'repaired'
  | 'verified'
  | 'closed'
  | 'reopened';
export type AuthorityLevel =
  | 'ward_engineer'
  | 'executive_engineer'
  | 'commissioner'
  | 'state_department'
  | 'public';

export interface Authority {
  id: string;
  name: string;
  level: AuthorityLevel;
  parentId?: string;
  openCount: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  roadClass: 0 | 1 | 2 | 3;
  authorityId: string;
  rci: number;
  rciUpdatedAt: string;
  lengthKm: number;
  geometry: [number, number][];
}

export interface Detection {
  id: string;
  ticketId?: string;
  segmentId: string;
  deviceHash: string;
  damageClass: DamageClass;
  confidence: number;
  imuScore: number;
  capturedAt: string;
  imageUrl: string;
  bbox: [number, number, number, number];
  night: boolean;
}

export interface DamageEvent {
  id: string;
  segmentId: string;
  point: { x: number; y: number };
  damageClass: DamageClass;
  severity: number;
  confidence: number;
  passes: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'ticketed' | 'fixed' | 'closed';
}

export interface Ticket {
  id: string;
  eventId: string;
  location: string;
  chainage?: string;
  coordinates: { lat: number; lng: number };
  damageClass: DamageClass;
  confidence: number;
  passes: number;
  severity: number;
  severityFactors: { label: string; value: number }[];
  state: TicketState;
  level: AuthorityLevel;
  authorityId: string;
  contractorId?: string;
  slaAckDue: string;
  slaFixDue: string;
  daysOver?: number;
  daysLeft?: number;
  createdAt: string;
  updatedAt: string;
  estimate?: { areaM2: number; ratePerM2: number; total: number; warrantyUntil: string };
  followers: number;
  vehiclesPerDay: number;
  nearbyOpen: number;
  evidence: { url: string; capturedAt: string; confidence: number; night?: boolean }[];
  cleanPasses?: { done: number; required: number };
}

export interface AuditEvent {
  id: string;
  ticketId: string;
  action: string;
  actor: string;
  at: string;
  hash: string;
  prevHash: string;
  tone: 'good' | 'warn' | 'bad';
}

export interface Contractor {
  id: string;
  name: string;
  panel: string;
  since: number;
  jobsClosed: number;
  cameBack: number;
  reliability: number;
  medianDays: number;
  ratePerM2: number;
  openLoad: number;
  flagged: boolean;
}

export interface WorkOrder {
  id: string;
  ticketId: string;
  location: string;
  areaM2: number;
  contractorId: string;
  amount: number;
  state: string;
}

export interface Ward {
  id: string;
  name: string;
  score: number;
  open: number;
  breached: number;
}

export interface ForecastSegment {
  segmentId: string;
  name: string;
  lengthKm: number;
  rciNow: number;
  rciForecast: number;
  failureRisk: number;
  costSealNow: number;
  costRebuildLater: number;
}

export interface ModelVersion {
  version: string;
  trainedAt: string;
  dataset: string;
  map50: number;
  precision: number;
  state: string;
}

export const CLASS_LABEL: Record<DamageClass, string> = {
  pothole: 'Pothole',
  alligator: 'Alligator crack',
  longitudinal: 'Longitudinal crack',
  transverse: 'Transverse crack',
  edge_break: 'Edge break',
};

export const CLASS_SEVERITY: Record<DamageClass, Severity> = {
  pothole: 'critical',
  alligator: 'high',
  longitudinal: 'medium',
  transverse: 'low',
  edge_break: 'low',
};
