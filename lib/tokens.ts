export const color = {
  // brand
  mark: '#F2B01E', // road-marking amber. Wordmark and live/hazard accents ONLY.

  // semantic — traffic signal logic
  red: '#F04438',
  amber: '#F79009',
  green: '#12B76A',
  greenLift: '#32D583',
  blue: '#2E90FA',
  blueLift: '#84CAFF',
  redLift: '#F97066',
  yellow: '#FDB022',

  // asphalt (authority, dark)
  a: {
    bg: '#000000',
    panel: '#0A0A0A',
    raise: '#111111',
    inset: '#141414',
    line: '#1C1C1C',
    lineSoft: '#141414',
    control: '#0F0F0F',
    border: '#262626',
    ink: '#EDEDED',
    ink2: '#C4C4C4',
    muted: '#8F8F8F',
    dim: '#6E6E6E',
    faint: '#3A3A3A',
  },

  // concrete (citizen, light)
  c: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    inset: '#FAFAFA',
    line: '#EDEDED',
    lineSoft: '#F2F2F2',
    track: '#F0F0F0',
    border: '#E6E6E6',
    ink: '#0A0A0A',
    muted: '#737373',
    dim: '#A3A3A3',
  },
} as const;

export type Theme = 'dark' | 'light';
export type Tone = 'red' | 'amber' | 'green' | 'blue' | 'brand' | 'neutral' | 'yellow';

/** Surface tokens for a theme. */
export function surf(t: Theme) {
  return t === 'dark'
    ? {
        bg: color.a.bg,
        panel: color.a.panel,
        inset: color.a.inset,
        raise: color.a.raise,
        control: color.a.control,
        line: color.a.line,
        lineSoft: color.a.lineSoft,
        border: color.a.border,
        ink: color.a.ink,
        muted: color.a.muted,
        dim: color.a.dim,
        track: color.a.line,
        radius: 14,
      }
    : {
        bg: color.c.bg,
        panel: color.c.surface,
        inset: color.c.inset,
        raise: color.c.inset,
        control: color.c.surface,
        line: color.c.line,
        lineSoft: '#F5F5F5',
        border: color.c.border,
        ink: color.c.ink,
        muted: color.c.muted,
        dim: color.c.dim,
        track: color.c.track,
        radius: 16,
      };
}

/** Chip border tints and text colours per theme. */
export const chipTint: Record<Theme, Record<Tone, { border: string; ink: string }>> = {
  dark: {
    red: { border: '#3A1A18', ink: color.redLift },
    amber: { border: '#3A2A12', ink: color.amber },
    green: { border: '#123024', ink: color.greenLift },
    blue: { border: '#12263A', ink: color.blueLift },
    brand: { border: '#33290F', ink: color.mark },
    yellow: { border: '#3A2F12', ink: color.yellow },
    neutral: { border: '#262626', ink: color.a.ink2 },
  },
  light: {
    red: { border: '#FBDDD9', ink: color.red },
    amber: { border: '#FAE7C6', ink: '#B45E09' },
    green: { border: '#CFEEDD', ink: '#0B8A52' },
    blue: { border: '#D5E7FB', ink: '#1B6FCB' },
    brand: { border: '#F5E6C4', ink: '#94700A' },
    yellow: { border: '#F7E6BE', ink: '#96690A' },
    neutral: { border: '#EAEAEA', ink: color.c.muted },
  },
};

/** Semantic colour for a tone, lifted where needed on dark. */
export function toneColor(tone: Tone, t: Theme = 'dark') {
  const map: Record<Tone, string> = {
    red: t === 'dark' ? color.redLift : color.red,
    amber: color.amber,
    green: t === 'dark' ? color.greenLift : color.green,
    blue: t === 'dark' ? color.blueLift : color.blue,
    brand: color.mark,
    yellow: color.yellow,
    neutral: t === 'dark' ? color.a.ink2 : color.c.muted,
  };
  return map[tone];
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'good' | 'new';

export const severityTone: Record<Severity, Tone> = {
  critical: 'red',
  high: 'amber',
  medium: 'yellow',
  low: 'blue',
  good: 'green',
  new: 'brand',
};

export function severityColor(s: Severity, t: Theme = 'dark') {
  return toneColor(severityTone[s], t);
}

/** Derived colour rules from §8. */
export const slaTone = (daysOver?: number, daysLeft?: number): Tone =>
  daysOver && daysOver > 0 ? 'red' : daysLeft !== undefined && daysLeft <= 2 ? 'amber' : 'neutral';
export const scoreTone = (n: number): Tone => (n < 50 ? 'red' : n < 70 ? 'amber' : 'green');
export const reliabilityTone = (n: number): Tone => (n < 0.6 ? 'red' : n < 0.8 ? 'amber' : 'green');
