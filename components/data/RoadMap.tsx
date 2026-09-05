'use client';

import React, { useId, useMemo } from 'react';
import { color, severityColor, type Severity, type Theme } from '@/lib/tokens';

/* ── types ─────────────────────────────────────────────────────────── */

export interface DamagePoint {
  x: number;
  y: number;
  sev: Severity;
  ring?: boolean;
  badge?: string;
  label?: string;
  r?: number;
}

export interface Pin {
  x: number;
  y: number;
  label?: string;
  tone?: 'black' | 'amber';
}

export interface Route {
  points: [number, number][];
  color: string;
  dash?: string;
  width?: number;
}

export interface RoadMapProps {
  width: number;
  height: number;
  theme?: Theme;
  points?: DamagePoint[];
  pins?: Pin[];
  routes?: Route[];
  rci?: boolean;
  coverage?: boolean;
  labels?: boolean;
  focus?: [number, number, number];
  seed?: number;
  style?: React.CSSProperties;
}

/* ── the road graph ────────────────────────────────────────────────── */

type Arterial = [string, [number, number][], 0 | 1 | 2 | 3];

export const ARTERIALS: Arterial[] = [
  ['M.G. Road', [[0, 0.15], [0.22, 0.13], [0.46, 0.16], [0.7, 0.2], [1, 0.23]], 1],
  ['A.T. Road', [[0, 0.28], [0.2, 0.26], [0.42, 0.29], [0.62, 0.34]], 1],
  ['G.S. Road', [[0.44, 0.3], [0.47, 0.47], [0.505, 0.65], [0.545, 0.85], [0.575, 1]], 0],
  ['R.G. Baruah Road', [[0.28, 0.44], [0.48, 0.475], [0.68, 0.445], [0.88, 0.475]], 1],
  ['Zoo Road', [[0.33, 0.365], [0.52, 0.335], [0.7, 0.295], [0.9, 0.305]], 2],
  ['NH-27 Bypass', [[0.04, 0.8], [0.3, 0.835], [0.55, 0.795], [0.78, 0.725], [1, 0.665]], 0],
  ['Beltola Road', [[0.545, 0.73], [0.7, 0.835], [0.86, 0.945]], 2],
  ['Lokhra Road', [[0.19, 0.62], [0.335, 0.725], [0.455, 0.885], [0.51, 1]], 2],
  ['Jalukbari Link', [[0, 0.42], [0.135, 0.375], [0.29, 0.415]], 2],
  ['Six Mile Link', [[0.72, 0.455], [0.765, 0.6], [0.8, 0.735]], 2],
  ['Hengrabari Road', [[0.6, 0.525], [0.715, 0.585], [0.815, 0.63]], 3],
  ['Kahilipara Road', [[0.36, 0.55], [0.44, 0.66], [0.5, 0.79]], 3],
  ['Sarusajai Road', [[0.6, 0.9], [0.74, 0.93]], 3],
  ['Chandmari Road', [[0.61, 0.2], [0.655, 0.31], [0.69, 0.44]], 3],
];

const CLASS_W: Record<number, [number, number]> = {
  0: [8.5, 5.5],
  1: [6.5, 4],
  2: [5, 3],
  3: [4, 2.4],
};

/** Default road condition ranges, used when `rci` is on. */
const CONDITION: Record<string, [number, number, 'red' | 'amber' | 'green'][]> = {
  'G.S. Road': [[0, 0.35, 'green'], [0.35, 0.62, 'amber'], [0.62, 1, 'red']],
  'A.T. Road': [[0, 0.55, 'red'], [0.55, 1, 'amber']],
  'NH-27 Bypass': [[0, 0.45, 'green'], [0.45, 0.72, 'amber'], [0.72, 1, 'green']],
  'R.G. Baruah Road': [[0, 0.4, 'amber'], [0.4, 1, 'green']],
  'Lokhra Road': [[0, 0.5, 'amber'], [0.5, 1, 'red']],
  'Zoo Road': [[0, 1, 'green']],
  'M.G. Road': [[0, 1, 'green']],
  'Beltola Road': [[0, 1, 'amber']],
};

const PALETTE = {
  dark: {
    land: '#0A0A0A',
    land2: '#101010',
    water: '#0B1A22',
    green: '#101A15',
    minor: '#1C1C1C',
    casing: '#000000',
    road: '#2B2B2B',
    road2: '#3A3A3A',
    hill: '#121614',
    label: '#8F8F8F',
  },
  light: {
    land: '#ECECEC',
    land2: '#F2F2F2',
    water: '#D7E6EF',
    green: '#E2EBE0',
    minor: '#FFFFFF',
    casing: '#DEDEDE',
    road: '#FFFFFF',
    road2: '#FFFFFF',
    hill: '#E6E6E6',
    label: '#8A8A8A',
  },
};

/* ── geometry helpers ──────────────────────────────────────────────── */

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull–Rom through the points, emitted as cubic Béziers. */
export function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function cumulative(pts: [number, number][]) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return acc;
}

/** Point at normalised distance t along a polyline. */
export function pointAt(pts: [number, number][], t: number): [number, number] {
  const acc = cumulative(pts);
  const total = acc[acc.length - 1];
  const target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < acc.length; i++) {
    if (acc[i] >= target) {
      const f = (target - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f,
      ];
    }
  }
  return pts[pts.length - 1];
}

/** Sub-range of a polyline between normalised distances t0 and t1. */
export function slice(pts: [number, number][], t0: number, t1: number): [number, number][] {
  const acc = cumulative(pts);
  const total = acc[acc.length - 1];
  const a = Math.min(t0, t1) * total;
  const b = Math.max(t0, t1) * total;
  const out: [number, number][] = [pointAt(pts, Math.min(t0, t1))];
  for (let i = 1; i < acc.length; i++) {
    if (acc[i] > a && acc[i] < b) out.push(pts[i]);
  }
  out.push(pointAt(pts, Math.max(t0, t1)));
  return t0 <= t1 ? out : out.reverse();
}

/** Named arterial geometry, for building routes that follow real roads. */
export function road(name: string): [number, number][] {
  const found = ARTERIALS.find((a) => a[0] === name);
  return found ? found[1] : [];
}

/** A slice of a named arterial, in normalised map space. */
export function roadSlice(name: string, t0: number, t1: number): [number, number][] {
  return slice(road(name), t0, t1);
}

const PLACES: [string, number, number][] = [
  ['Fancy Bazar', 0.3, 0.2],
  ['Ganeshguri', 0.435, 0.535],
  ['Six Mile', 0.755, 0.6],
  ['Maligaon', 0.11, 0.4],
  ['Khanapara', 0.9, 0.7],
  ['Dispur', 0.52, 0.6],
];

/* ── component ─────────────────────────────────────────────────────── */

export default function RoadMap({
  width,
  height,
  theme = 'dark',
  points = [],
  pins = [],
  routes = [],
  rci = false,
  coverage = false,
  labels = true,
  focus,
  seed = 7,
  style,
}: RoadMapProps) {
  const uid = useId().replace(/[:]/g, '');
  const p = PALETTE[theme];
  const X = (v: number) => v * width;
  const Y = (v: number) => v * height;

  const mesh = useMemo(() => {
    const rnd = mulberry32(seed * 9161);
    const lines: string[] = [];
    for (let i = 0; i < 40; i++) {
      const y = rnd();
      const x0 = rnd() * 0.86;
      const len = 0.06 + rnd() * 0.16;
      const pts: [number, number][] = [
        [X(x0), Y(y)],
        [X(x0 + len * 0.5), Y(y + (rnd() - 0.5) * 0.02)],
        [X(x0 + len), Y(y + (rnd() - 0.5) * 0.03)],
      ];
      lines.push(smoothPath(pts));
    }
    for (let i = 0; i < 34; i++) {
      const x = rnd();
      const y0 = rnd() * 0.86;
      const len = 0.05 + rnd() * 0.15;
      const pts: [number, number][] = [
        [X(x), Y(y0)],
        [X(x + (rnd() - 0.5) * 0.02), Y(y0 + len * 0.5)],
        [X(x + (rnd() - 0.5) * 0.03), Y(y0 + len)],
      ];
      lines.push(smoothPath(pts));
    }
    return lines;
  }, [seed, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  const patches = useMemo(() => {
    const rnd = mulberry32(seed * 331 + 11);
    return Array.from({ length: 7 }, () => ({
      cx: rnd(),
      cy: 0.15 + rnd() * 0.8,
      rx: 0.02 + rnd() * 0.05,
      ry: 0.014 + rnd() * 0.03,
    }));
  }, [seed]);

  const river = smoothPath(
    ([[0, 0.075], [0.18, 0.1], [0.36, 0.085], [0.55, 0.115], [0.75, 0.1], [1, 0.135]] as [
      number,
      number,
    ][]).map(([x, y]) => [X(x), Y(y)] as [number, number]),
  );

  const hills: [number, number][] = [
    [0.1, 0.235],
    [0.665, 0.575],
    [0.86, 0.155],
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', ...style }}
      role="img"
      aria-label="Map of Guwahati road network with reported road damage"
    >
      <defs>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.water} stopOpacity="1" />
          <stop offset="100%" stopColor={p.water} stopOpacity="0.72" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={Math.max(3, width * 0.008)} />
        </filter>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* 1 · land */}
        <rect x="0" y="0" width={width} height={height} fill={p.land} />

        {/* 2 · the Brahmaputra */}
        <path
          d={`${river} L${width},0 L0,0 Z`}
          fill={`url(#${uid}-water)`}
        />
        <ellipse cx={X(0.3)} cy={Y(0.055)} rx={X(0.075)} ry={Y(0.016)} fill={p.land2} opacity={0.8} />

        {/* 3 · hills */}
        {hills.map(([hx, hy], i) => (
          <g key={`h${i}`}>
            <ellipse cx={X(hx)} cy={Y(hy)} rx={width * 0.055} ry={height * 0.055 * 1.35} fill={p.hill} opacity={0.85} />
            {[1, 0.68, 0.4].map((k, j) => (
              <ellipse
                key={j}
                cx={X(hx)}
                cy={Y(hy)}
                rx={width * [0.055, 0.045, 0.038][j] * k}
                ry={height * [0.055, 0.045, 0.038][j] * 1.35 * k}
                fill="none"
                stroke={p.minor}
                strokeWidth={1}
                opacity={0.5 - j * 0.13}
              />
            ))}
          </g>
        ))}

        {/* 4 · ponds and parks */}
        {([[0.3, 0.185], [0.455, 0.895], [0.79, 0.545]] as [number, number][]).map(([px, py], i) => (
          <rect
            key={`pond${i}`}
            x={X(px) - width * 0.022}
            y={Y(py) - height * 0.016}
            width={width * 0.044}
            height={height * 0.032}
            rx={5}
            fill={p.water}
          />
        ))}
        {([[0.245, 0.52], [0.62, 0.245], [0.88, 0.83]] as [number, number][]).map(([px, py], i) => (
          <ellipse
            key={`park${i}`}
            cx={X(px)}
            cy={Y(py)}
            rx={width * 0.045}
            ry={height * 0.042}
            fill={p.green}
          />
        ))}
        {patches.map((c, i) => (
          <ellipse
            key={`pt${i}`}
            cx={X(c.cx)}
            cy={Y(c.cy)}
            rx={width * c.rx}
            ry={height * c.ry}
            fill={p.land2}
            opacity={0.55}
          />
        ))}

        {/* 5 · minor street mesh */}
        <g stroke={p.minor} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.9}>
          {mesh.map((d, i) => (
            <path key={`m${i}`} d={d} />
          ))}
        </g>

        {/* 8 · coverage halo (under the arterials) */}
        {coverage
          ? ARTERIALS.filter((a) => a[2] <= 2).map(([name, pts]) => (
              <path
                key={`cov-${name}`}
                d={smoothPath(pts.map(([x, y]) => [X(x), Y(y)] as [number, number]))}
                stroke={color.mark}
                strokeOpacity={0.07}
                strokeWidth={18}
                fill="none"
                strokeLinecap="round"
              />
            ))
          : null}

        {/* 6 · arterials: casing then fill */}
        {ARTERIALS.map(([name, pts, cls]) => {
          const d = smoothPath(pts.map(([x, y]) => [X(x), Y(y)] as [number, number]));
          const [cw] = CLASS_W[cls];
          return (
            <path
              key={`c-${name}`}
              d={d}
              stroke={p.casing}
              strokeWidth={cw}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {ARTERIALS.map(([name, pts, cls]) => {
          const d = smoothPath(pts.map(([x, y]) => [X(x), Y(y)] as [number, number]));
          const [, fw] = CLASS_W[cls];
          return (
            <path
              key={`f-${name}`}
              d={d}
              stroke={cls <= 1 ? p.road2 : p.road}
              strokeWidth={fw}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* 7 · condition overlay */}
        {rci
          ? Object.entries(CONDITION).flatMap(([name, ranges]) => {
              const pts = road(name);
              if (!pts.length) return [];
              return ranges.map(([t0, t1, tone], i) => (
                <path
                  key={`rci-${name}-${i}`}
                  d={smoothPath(
                    slice(pts, t0, t1).map(([x, y]) => [X(x), Y(y)] as [number, number]),
                  )}
                  stroke={tone === 'red' ? color.red : tone === 'amber' ? color.amber : color.green}
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                />
              ));
            })
          : null}

        {/* 9 · routes */}
        {routes.map((r, i) => {
          const d = smoothPath(r.points.map(([x, y]) => [X(x), Y(y)] as [number, number]));
          return (
            <g key={`r${i}`}>
              <path
                d={d}
                stroke={r.color}
                strokeOpacity={0.18}
                strokeWidth={(r.width ?? 4) + 12}
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={d}
                stroke={r.color}
                strokeWidth={r.width ?? 4}
                strokeDasharray={r.dash}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* 10 · labels */}
        {labels ? (
          <g fill={p.label} style={{ pointerEvents: 'none' }}>
            {ARTERIALS.filter((a) => a[2] <= 2).map(([name, pts]) => {
              const [ax, ay] = pointAt(pts, 0.45);
              const [bx, by] = pointAt(pts, 0.55);
              // rounded: raw atan2 differs in the last float digit between server and browser
              const angle = ((Math.atan2(Y(by) - Y(ay), X(bx) - X(ax)) * 180) / Math.PI).toFixed(2);
              return (
                <text
                  key={`l-${name}`}
                  x={X((ax + bx) / 2)}
                  y={Y((ay + by) / 2) - 7}
                  fontSize={11.5}
                  fontWeight={600}
                  letterSpacing="-0.01em"
                  textAnchor="middle"
                  transform={`rotate(${angle} ${X((ax + bx) / 2)} ${Y((ay + by) / 2) - 7})`}
                >
                  {name}
                </text>
              );
            })}
            <text x={X(0.17)} y={Y(0.045)} fontSize={10.5} letterSpacing="0.02em">
              Brahmaputra
            </text>
            {PLACES.map(([name, px, py]) => (
              <text key={name} x={X(px)} y={Y(py)} fontSize={10.5} textAnchor="middle">
                {name}
              </text>
            ))}
          </g>
        ) : null}

        {/* 13 · knock-back wash on dark */}
        {theme === 'dark' ? (
          <rect x="0" y="0" width={width} height={height} fill="#000" opacity={0.07} />
        ) : null}

        {/* focus ring */}
        {focus ? (
          <circle
            cx={X(focus[0])}
            cy={Y(focus[1])}
            r={focus[2]}
            fill="none"
            stroke={color.mark}
            strokeWidth={1.4}
            strokeDasharray="4 4"
            opacity={0.9}
          />
        ) : null}

        {/* 11 · damage points */}
        {points.map((pt, i) => {
          const c = severityColor(pt.sev, theme);
          const r = pt.r ?? (pt.sev === 'critical' ? 7 : pt.sev === 'high' ? 6 : 5);
          return (
            <g key={`d${i}`}>
              <circle cx={X(pt.x)} cy={Y(pt.y)} r={r * 3} fill={c} opacity={0.16} filter={`url(#${uid}-glow)`} />
              {pt.ring ? (
                <circle
                  cx={X(pt.x)}
                  cy={Y(pt.y)}
                  r={r + 6}
                  fill="none"
                  stroke={c}
                  strokeWidth={1.2}
                  opacity={0.75}
                />
              ) : null}
              <circle
                cx={X(pt.x)}
                cy={Y(pt.y)}
                r={r}
                fill={c}
                stroke={theme === 'dark' ? '#000' : '#FFF'}
                strokeWidth={1.4}
              />
              {pt.badge ? (
                <text
                  x={X(pt.x)}
                  y={Y(pt.y) + 3}
                  fontSize={8.5}
                  fontWeight={700}
                  textAnchor="middle"
                  fill={theme === 'dark' ? '#000' : '#FFF'}
                >
                  {pt.badge}
                </text>
              ) : null}
              {pt.label ? (
                <g>
                  <rect
                    x={X(pt.x) + r + 7}
                    y={Y(pt.y) - 10}
                    width={pt.label.length * 6.1 + 14}
                    height={20}
                    rx={6}
                    fill={theme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
                    stroke={theme === 'dark' ? '#262626' : '#E6E6E6'}
                  />
                  <text
                    x={X(pt.x) + r + 14}
                    y={Y(pt.y) + 4}
                    fontSize={10.5}
                    fill={theme === 'dark' ? '#C4C4C4' : '#0A0A0A'}
                    style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                  >
                    {pt.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {/* 12 · pins */}
        {pins.map((pin, i) => {
          const fill = pin.tone === 'amber' ? color.mark : theme === 'dark' ? '#FAFAFA' : '#0A0A0A';
          const ink = theme === 'dark' ? '#000' : pin.tone === 'amber' ? '#0A0A0A' : '#FFF';
          const px = X(pin.x);
          const py = Y(pin.y);
          return (
            <g key={`pin${i}`}>
              <path
                d={`M${px},${py} c-9,-11 -13,-16 -13,-22 a13,13 0 0 1 26,0 c0,6 -4,11 -13,22 z`}
                fill={fill}
              />
              <circle cx={px} cy={py - 22} r={4.6} fill={ink} />
              {pin.label ? (
                <g>
                  <rect
                    x={px + 12}
                    y={py - 33}
                    width={pin.label.length * 6.4 + 16}
                    height={22}
                    rx={7}
                    fill={theme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
                    stroke={theme === 'dark' ? '#262626' : '#E6E6E6'}
                  />
                  <text
                    x={px + 20}
                    y={py - 18}
                    fontSize={11.5}
                    fontWeight={600}
                    letterSpacing="-0.01em"
                    fill={theme === 'dark' ? '#EDEDED' : '#0A0A0A'}
                  >
                    {pin.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
