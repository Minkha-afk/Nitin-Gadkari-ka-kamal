'use client';

import React from 'react';
import Brand from '@/components/chrome/Brand';
import { Chip } from '@/components/system';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import RoadMap, { roadSlice } from '@/components/data/RoadMap';
import RoughnessTrace from '@/components/data/RoughnessTrace';
import { color } from '@/lib/tokens';

const ROUTE = roadSlice('G.S. Road', 0.95, 0.18);

export default function DrivePage() {
  return (
    <div style={{ display: 'flex', height: '100%', background: '#000', overflow: 'hidden' }}>
      {/* camera pane */}
      <div style={{ width: 880, flexShrink: 0, position: 'relative', height: '100%' }}>
        <EvidenceFrame
          width={880}
          height={1024}
          kind="pothole"
          horizon={0.46}
          far
          boxes={[{ label: 'Pothole .94' }]}
          seed={17}
          radius={0}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 60%, rgba(0,0,0,.9) 100%)',
          }}
        />

        {/* top left */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Brand theme="dark" />
          <Chip tone="green" dot>
            Sensing · on-device
          </Chip>
          <Chip>GPS 4 m · 42 km/h</Chip>
        </div>

        {/* the alert */}
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 112,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 520,
          }}
        >
          <div
            style={{
              background: color.red,
              borderRadius: 14,
              boxShadow: '0 18px 48px rgba(240,68,56,.35)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              color: '#FFF',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 62,
                height: 62,
                background: '#000',
                transform: 'rotate(45deg)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  transform: 'rotate(-45deg)',
                  color: color.mark,
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                !
              </span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 31, fontWeight: 700, letterSpacing: '-0.032em' }}>
                Pothole ahead
              </span>
              <span style={{ display: 'block', fontSize: 14, marginTop: 4, opacity: 0.9 }}>
                Left lane · G.S. Road, before Ganeshguri flyover
              </span>
            </span>
            <span style={{ textAlign: 'center', flexShrink: 0 }}>
              <span className="num" style={{ display: 'block', fontSize: 44 }}>
                80
              </span>
              <span style={{ display: 'block', fontSize: 12, opacity: 0.9 }}>metres</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <span
              style={{
                background: 'rgba(10,10,10,.72)',
                border: `1px solid ${color.a.border}`,
                color: color.a.ink2,
                borderRadius: 7,
                height: 23,
                padding: '0 9px',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Spoken alert played · slow to 25 km/h
            </span>
          </div>
        </div>

        {/* bottom left */}
        <div
          style={{
            position: 'absolute',
            left: 24,
            bottom: 26,
            background: 'rgba(10,10,10,.66)',
            border: `1px solid ${color.a.border}`,
            borderRadius: 12,
            padding: '13px 16px',
          }}
        >
          <div className="lbl" style={{ color: color.a.muted }}>
            This trip
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 9 }}>
            {[
              ['18.4 km', 'sensed', color.a.ink],
              ['7', 'detections', color.a.ink],
              ['+90', 'points', color.mark],
            ].map(([v, l, c]) => (
              <span key={l}>
                <span className="num" style={{ display: 'block', fontSize: 20, color: c }}>
                  {v}
                </span>
                <span className="tiny" style={{ color: color.a.muted }}>
                  {l}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* bottom right */}
        <div
          style={{
            position: 'absolute',
            right: 24,
            bottom: 26,
            width: 330,
            background: 'rgba(10,10,10,.66)',
            border: `1px solid ${color.a.border}`,
            borderRadius: 12,
            padding: '13px 16px',
          }}
        >
          <p className="sub" style={{ color: color.a.ink2, fontSize: 12.5 }}>
            Number plates and faces are blurred on your phone. Only the cropped damage is uploaded.
          </p>
        </div>
      </div>

      {/* navigation pane */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <RoadMap
          width={560}
          height={1024}
          theme="dark"
          labels={false}
          seed={6}
          routes={[{ points: ROUTE, color: color.mark, width: 5 }]}
          points={[
            { x: 0.5, y: 0.46, sev: 'critical', ring: true },
            { x: 0.42, y: 0.68, sev: 'high' },
            { x: 0.6, y: 0.3, sev: 'medium' },
          ]}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '22px 24px 40px',
            background: 'linear-gradient(180deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <div className="lbl" style={{ color: color.a.muted }}>
            Driving to
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.028em', marginTop: 6 }}>
            Six Mile, via G.S. Road
          </div>
          <div className="sub" style={{ color: color.a.ink2, marginTop: 6 }}>
            14 min · smoothest route · 3 known hazards on the way
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '48px 24px 26px',
            background: 'linear-gradient(0deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 10 }}>
            Ride quality, last 5 km
          </div>
          <RoughnessTrace width={500} height={60} rough theme="dark" seed={5} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, width: 500 }}>
            <span className="tiny" style={{ color: color.a.muted }}>
              Bharalu bridge
            </span>
            <span className="tiny" style={{ color: color.a.muted }}>
              Ganeshguri
            </span>
            <span className="tiny" style={{ color: color.mark }}>
              rough stretch 640 m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
