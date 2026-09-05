'use client';

import React, { useId } from 'react';
import { mulberry32 } from './RoadMap';
import { color } from '@/lib/tokens';

export type DamageKind = 'pothole' | 'alligator' | 'crack' | 'repaired' | 'clean';

export interface EvidenceFrameProps {
  width: number;
  height: number;
  kind?: DamageKind;
  horizon?: number;
  far?: boolean;
  night?: boolean;
  boxes?: { label: string }[];
  seed?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export default function EvidenceFrame({
  width,
  height,
  kind = 'pothole',
  horizon = 0.3,
  far = false,
  night = false,
  boxes,
  seed = 5,
  radius = 10,
  style,
}: EvidenceFrameProps) {
  const uid = useId().replace(/:/g, '');
  const rnd = mulberry32(seed * 6151 + 13);
  // round every derived coordinate: raw floats can differ in the last digit
  // between the server and the browser, which trips hydration
  const q = (n: number) => Math.round(n * 100) / 100;
  const hy = height * horizon;

  // road trapezoid in perspective
  const roadTop = width * 0.5;
  const topHalf = width * 0.055;
  const botHalf = width * 0.62;
  const roadPath = `M${roadTop - topHalf},${hy} L${roadTop + topHalf},${hy} L${roadTop + botHalf},${height} L${roadTop - botHalf},${height} Z`;

  // damage geometry
  const dCx = q(far ? roadTop + width * 0.02 : roadTop * 0.98);
  const dCy = q(far ? hy + (height - hy) * 0.3 : hy + (height - hy) * 0.72);
  const dScale = far ? 0.42 : 1;
  const dRx = q(width * 0.15 * dScale);
  const dRy = q(height * 0.055 * dScale);

  const skyline = Array.from({ length: 14 }, () => ({
    x: rnd(),
    w: 0.03 + rnd() * 0.06,
    h: 0.02 + rnd() * 0.07,
    tree: rnd() < 0.4,
  }));
  const asphalt = Array.from({ length: 9 }, () => ({
    x: 0.2 + rnd() * 0.6,
    y: 0.05 + rnd() * 0.9,
    rx: 0.02 + rnd() * 0.07,
    ry: 0.008 + rnd() * 0.025,
    o: 0.05 + rnd() * 0.09,
  }));

  // receding centre dashes
  const dashes = Array.from({ length: 9 }, (_, i) => {
    const t = i / 9;
    const y0 = q(hy + (height - hy) * (t * t * 0.96 + 0.02));
    const y1 = q(hy + (height - hy) * (Math.pow(t + 0.075, 2) * 0.96 + 0.02));
    return { y0, y1, w: q(1.2 + t * t * 12) };
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', borderRadius: radius, ...style }}
      role="img"
      aria-label={
        kind === 'repaired'
          ? 'Dashcam frame showing a repaired bitumen patch'
          : kind === 'clean'
            ? 'Dashcam frame showing clean road surface'
            : `Dashcam frame showing road ${kind === 'alligator' ? 'alligator cracking' : kind}`
      }
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={night ? '#0B1420' : '#8FA6B8'} />
          <stop offset="100%" stopColor={night ? '#16202C' : '#CBD6DE'} />
        </linearGradient>
        <linearGradient id={`${uid}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A5155" />
          <stop offset="100%" stopColor="#33393D" />
        </linearGradient>
        <radialGradient id={`${uid}-head`} cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#FFF3D6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFF3D6" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width={width} height={height} rx={radius} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="0" y="0" width={width} height={hy + 1} fill={`url(#${uid}-sky)`} />
        <rect x="0" y={hy} width={width} height={height - hy} fill={night ? '#1E2A22' : '#5C6B4E'} />

        {/* horizon band of buildings and trees */}
        {skyline.map((b, i) =>
          b.tree ? (
            <ellipse
              key={i}
              cx={b.x * width}
              cy={hy - b.h * height * 0.5}
              rx={b.w * width * 0.4}
              ry={b.h * height * 0.6}
              fill={night ? '#101A16' : '#4E5C46'}
            />
          ) : (
            <rect
              key={i}
              x={b.x * width}
              y={hy - b.h * height}
              width={b.w * width}
              height={b.h * height}
              fill={night ? '#131B25' : '#7A8792'}
            />
          ),
        )}

        {/* road */}
        <path d={roadPath} fill={`url(#${uid}-road)`} />

        {/* asphalt texture */}
        <g clipPath={`url(#${uid}-clip)`}>
          {asphalt.map((a, i) => (
            <ellipse
              key={i}
              cx={a.x * width}
              cy={hy + (height - hy) * a.y}
              rx={a.rx * width}
              ry={a.ry * height}
              fill="#6A7276"
              opacity={a.o}
            />
          ))}
        </g>

        {/* edge lines */}
        <path
          d={`M${roadTop - topHalf * 0.86},${hy} L${roadTop - botHalf * 0.9},${height}`}
          stroke="#E8E8E4"
          strokeWidth={2}
          opacity={0.55}
          fill="none"
        />
        <path
          d={`M${roadTop + topHalf * 0.86},${hy} L${roadTop + botHalf * 0.9},${height}`}
          stroke="#E8E8E4"
          strokeWidth={2}
          opacity={0.55}
          fill="none"
        />

        {/* receding centre dashes */}
        {dashes.map((d, i) => (
          <line
            key={i}
            x1={roadTop}
            y1={d.y0}
            x2={roadTop}
            y2={d.y1}
            stroke="#E5E2D6"
            strokeWidth={d.w}
            opacity={0.7}
          />
        ))}

        {/* the damage */}
        {kind === 'pothole' ? (
          <g>
            <ellipse cx={dCx} cy={dCy} rx={dRx * 1.12} ry={dRy * 1.12} fill="#1C2124" opacity={0.9} />
            <ellipse cx={dCx} cy={dCy} rx={dRx} ry={dRy} fill="#0B0E10" />
            <ellipse
              cx={dCx - dRx * 0.18}
              cy={dCy - dRy * 0.2}
              rx={dRx * 0.55}
              ry={dRy * 0.5}
              fill="#252C30"
            />
          </g>
        ) : null}

        {kind === 'alligator'
          ? Array.from({ length: 16 }, (_, i) => {
              const cx = q(dCx + (rnd() - 0.5) * dRx * 3.4);
              const cy = q(dCy + (rnd() - 0.5) * dRy * 4.2);
              const len = 8 + rnd() * 22;
              const ang = rnd() * Math.PI;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={q(cx + Math.cos(ang) * len)}
                  y2={q(cy + Math.sin(ang) * len)}
                  stroke="#14181A"
                  strokeWidth={1.8 + rnd() * 1.4}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              );
            })
          : null}

        {kind === 'crack' ? (
          <path
            d={`M${dCx - width * 0.02},${height} C${dCx + width * 0.05},${dCy + dRy * 3} ${dCx - width * 0.06},${dCy} ${dCx + width * 0.01},${hy + (height - hy) * 0.18}`}
            stroke="#14181A"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {kind === 'repaired' ? (
          <g>
            <path
              d={`M${dCx - dRx * 1.5},${dCy + dRy * 1.6} L${dCx + dRx * 1.5},${dCy + dRy * 1.6} L${dCx + dRx * 1.05},${dCy - dRy * 1.5} L${dCx - dRx * 1.05},${dCy - dRy * 1.5} Z`}
              fill="#2F3538"
              stroke="#121618"
              strokeWidth={2.4}
            />
            {[0.3, 0.5, 0.7].map((f, i) => (
              <line
                key={i}
                x1={dCx - dRx * 1.3}
                y1={q(dCy - dRy * 1.5 + dRy * 3.1 * f)}
                x2={dCx + dRx * 1.3}
                y2={q(dCy - dRy * 1.5 + dRy * 3.1 * f)}
                stroke="#454D51"
                strokeWidth={1.2}
                opacity={0.7}
              />
            ))}
          </g>
        ) : null}

        {night ? (
          <>
            <rect x="0" y="0" width={width} height={height} fill="#0A1626" opacity={0.42} />
            <rect x="0" y={hy} width={width} height={height - hy} fill={`url(#${uid}-head)`} />
          </>
        ) : null}

        {/* detection boxes */}
        {boxes?.map((b, i) => {
          const bw = q(dRx * 2.9);
          const bh = q(dRy * 3.4);
          const bx = q(dCx - bw / 2);
          const by = q(dCy - bh / 2);
          const tabW = b.label.length * 5.9 + 12;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={color.mark} strokeWidth={2} />
              <rect x={bx} y={by - 15} width={tabW} height={15} fill={color.mark} />
              <text x={bx + 6} y={by - 4} fontSize={10.5} fontWeight={600} fill="#0A0A0A">
                {b.label}
              </text>
            </g>
          );
        })}

        {/* vignette */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={radius}
          fill="none"
          stroke="#000"
          strokeWidth={26}
          opacity={0.13}
        />
      </g>
    </svg>
  );
}
