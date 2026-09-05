import type { ForecastSegment } from '@/lib/types';

export const FORECAST: (ForecastSegment & { note: string })[] = [
  { segmentId: 's1', name: 'G.S. Road, Bhangagarh to Ganeshguri', lengthKm: 1.8, rciNow: 52, rciForecast: 24, failureRisk: 0.91, costSealNow: 420000, costRebuildLater: 1960000, note: 'alligator cracking spreading' },
  { segmentId: 's2', name: 'Lokhra Road, Bharalu bridge approach', lengthKm: 0.9, rciNow: 58, rciForecast: 31, failureRisk: 0.84, costSealNow: 240000, costRebuildLater: 1110000, note: 'alligator cracking spreading' },
  { segmentId: 's3', name: 'R.G. Baruah Road, Zoo gate to Six Mile', lengthKm: 3.1, rciNow: 61, rciForecast: 38, failureRisk: 0.77, costSealNow: 680000, costRebuildLater: 2400000, note: 'alligator cracking spreading' },
  { segmentId: 's4', name: 'Beltola Road, market stretch', lengthKm: 1.2, rciNow: 64, rciForecast: 44, failureRisk: 0.68, costSealNow: 310000, costRebuildLater: 1240000, note: 'alligator cracking spreading' },
];

export const RAINFALL = { data: [61, 122, 240, 318, 402, 356, 210, 96], labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] };
export const DO_NOTHING = [71, 69, 66, 62, 57, 53, 49, 45, 41];
export const SEAL_NOW = [71, 69, 66, 62, 57, 55, 54, 54, 55];
export const FORECAST_LABELS = ['now', '+1w', '+2w', '+3w', '+4w', '+5w', '+6w', '+7w', '+8w'];
export const DRIVERS = [
  { label: 'Crack growth between passes', value: 0.34, bar: 88, tone: 'amber' as const },
  { label: 'Rainfall in next 30 days', value: 0.28, bar: 74, tone: 'blue' as const },
  { label: 'Years since last resurfacing', value: 0.21, bar: 56, tone: 'blue' as const },
  { label: 'Heavy vehicle share', value: 0.17, bar: 44, tone: 'blue' as const },
];
