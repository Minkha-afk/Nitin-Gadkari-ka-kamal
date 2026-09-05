import type { ModelVersion } from '@/lib/types';

export const VERSIONS: (ModelVersion & { tone: 'green' | 'neutral' | 'blue' })[] = [
  { version: 'v7 · yolo11n-int8', trainedAt: '01 Sep 2026', dataset: 'RDD2022 + 41k Guwahati frames', map50: 0.72, precision: 0.91, state: 'Live on 1,842 phones', tone: 'green' },
  { version: 'v6 · yolo11n-int8', trainedAt: '18 Aug 2026', dataset: 'RDD2022 + 33k Guwahati frames', map50: 0.69, precision: 0.89, state: 'Retired on 01 Sep', tone: 'neutral' },
  { version: 'v8 · yolo11s-int8', trainedAt: '04 Sep 2026', dataset: 'RDD2022 + 48k Guwahati frames', map50: 0.75, precision: 0.93, state: 'In shadow testing', tone: 'blue' },
];

export const UNSURE = [
  { conf: '.52', caption: 'Crack or tar seam?', kind: 'crack' as const, night: false },
  { conf: '.38', caption: 'Night, low light', kind: 'pothole' as const, night: true },
  { conf: '.44', caption: 'Shadow under tree', kind: 'crack' as const, night: false },
  { conf: '.57', caption: 'Wet patch or hole?', kind: 'pothole' as const, night: false },
  { conf: '.41', caption: 'Manhole edge', kind: 'repaired' as const, night: false },
  { conf: '.35', caption: 'Old patch texture', kind: 'repaired' as const, night: false },
  { conf: '.59', caption: 'Puddle over a hole', kind: 'pothole' as const, night: false },
  { conf: '.46', caption: 'Hairline or shadow?', kind: 'crack' as const, night: false },
  { conf: '.33', caption: 'Night, rain streaks', kind: 'alligator' as const, night: true },
];

export const CLASS_ACCURACY = [
  { label: 'D40 pothole', value: 0.81, tone: 'green' as const },
  { label: 'D20 alligator crack', value: 0.74, tone: 'green' as const },
  { label: 'D00 longitudinal crack', value: 0.63, tone: 'amber' as const },
  { label: 'D10 transverse crack', value: 0.58, tone: 'amber' as const },
];

export const SOURCES = [
  { label: 'Private cars and two-wheelers', value: 61, tone: 'brand' as const },
  { label: 'GMC trucks and buses', value: 24, tone: 'blue' as const },
  { label: 'Camera plus bump agreement', value: 11, tone: 'green' as const },
  { label: 'Bump signature only', value: 4, tone: 'neutral' as const },
];
