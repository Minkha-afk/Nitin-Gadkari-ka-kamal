'use client';

import React from 'react';
import Brand from '@/components/chrome/Brand';
import { Btn, Chip, ThemeProvider } from '@/components/system';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import { color } from '@/lib/tokens';

function Phone({
  children,
  caption,
  bg,
}: {
  children: React.ReactNode;
  caption: string;
  bg: string;
}) {
  return (
    <div>
      <div
        style={{
          width: 344,
          height: 790,
          borderRadius: 38,
          border: `9px solid ${color.a.line}`,
          background: bg,
          boxShadow: '0 26px 60px rgba(0,0,0,.45)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 96,
            height: 22,
            background: '#000',
            borderRadius: '0 0 12px 12px',
            zIndex: 3,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{children}</div>
      </div>
      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, letterSpacing: '-0.011em' }}>
        {caption}
      </div>
    </div>
  );
}

const LADDER = [
  { label: 'Reported by 12 vehicles', when: '24 Aug', tone: color.green },
  { label: 'Ticket raised with Ward 32', when: '24 Aug', tone: color.green },
  { label: 'Not acknowledged in 2 days', when: '26 Aug', tone: color.red, red: true },
  { label: 'Escalated to Executive Engineer', when: '26 Aug', tone: color.green },
  { label: 'Contractor assigned', when: 'pending', tone: color.amber, bold: true },
  { label: 'Repaired and verified by traffic', when: 'pending', tone: '#A3A3A3' },
];

export default function MobilePage() {
  return (
    <div className="scrollarea" style={{ flex: 1, background: '#000', padding: '40px 60px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 30,
        }}
      >
        <div>
          <h1 className="h1" style={{ color: color.a.ink }}>
            In the vehicle
          </h1>
          <p className="sub" style={{ color: color.a.muted, marginTop: 7 }}>
            The phone app is the sensor. Three moments: sensing, warning, and following what happens
            next.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Brand theme="dark" />
          <div className="tiny" style={{ color: color.a.muted, marginTop: 6 }}>
            Citizen app · Android and iOS
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 46, justifyContent: 'center' }}>
        {/* phone 1 */}
        <Phone caption="1 · Sensing while you drive" bg={color.a.panel}>
          <div style={{ padding: '30px 0 0' }}>
            <div style={{ position: 'relative' }}>
              <EvidenceFrame width={326} height={330} kind="alligator" seed={71} radius={0} />
              <span style={{ position: 'absolute', top: 12, left: 12 }}>
                <Chip tone="green" dot>
                  Recording road
                </Chip>
              </span>
            </div>
            <div style={{ padding: '18px 16px 0' }}>
              <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.028em', color: color.a.ink }}>
                Drive normally
              </div>
              <p className="sub" style={{ color: color.a.muted, marginTop: 7 }}>
                Mount the phone, put it in your pocket of attention. We handle the rest.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {[
                  ['18.4 km', 'sensed today', color.a.ink],
                  ['7', 'damage found', color.amber],
                ].map(([v, l, c]) => (
                  <div
                    key={l}
                    style={{
                      flex: 1,
                      background: color.a.inset,
                      border: `1px solid ${color.a.lineSoft}`,
                      borderRadius: 10,
                      padding: '11px 12px',
                    }}
                  >
                    <div className="num" style={{ fontSize: 22, color: c }}>
                      {v}
                    </div>
                    <div className="tiny" style={{ color: color.a.muted, marginTop: 5 }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  background: color.a.inset,
                  border: `1px solid ${color.a.lineSoft}`,
                  borderRadius: 10,
                  padding: '12px 13px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: color.a.ink }}>
                    Waiting to upload
                  </span>
                  <Chip tone="blue">3 clips · offline</Chip>
                </div>
                <p className="tiny" style={{ color: color.a.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Queued on the phone. They will sync when you reach Wi-Fi.
                </p>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 20 }}>
            <button
              type="button"
              style={{
                width: '100%',
                height: 46,
                borderRadius: 11,
                background: color.red,
                border: 'none',
                color: '#FFF',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              End drive
            </button>
          </div>
        </Phone>

        {/* phone 2 */}
        <Phone caption="2 · Hazard warning, 80 m ahead" bg={color.red}>
          <div style={{ padding: '40px 20px 0', color: '#FFF' }}>
            <div className="lbl" style={{ opacity: 0.82 }}>
              Hazard alert
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 6px' }}>
              <span
                aria-hidden
                style={{
                  width: 96,
                  height: 96,
                  background: '#000',
                  transform: 'rotate(45deg)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(-45deg)',
                    color: color.mark,
                    fontSize: 52,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  !
                </span>
              </span>
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                marginTop: 16,
              }}
            >
              Pothole
              <br />
              ahead
            </div>
            <div className="num" style={{ fontSize: 78, marginTop: 8 }}>
              80 m
            </div>
            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.92, lineHeight: 1.4 }}>
              Left lane, G.S. Road
              <br />
              before Ganeshguri flyover
            </div>
            <div
              style={{
                marginTop: 16,
                background: 'rgba(0,0,0,.22)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12.5,
              }}
            >
              Reported 9 days ago · still open with GMC
            </div>
            <div
              style={{
                marginTop: 12,
                background: 'rgba(0,0,0,.22)',
                borderRadius: 10,
                padding: '12px',
              }}
            >
              <div className="lbl" style={{ opacity: 0.82, marginBottom: 8 }}>
                Also on this road
              </div>
              {[
                ['640 m', 'Cracked stretch, both lanes'],
                ['1.4 km', 'Sunken patch near the drain'],
              ].map(([d, t]) => (
                <div key={t} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 12.5 }}>
                  <span className="mono" style={{ width: 52, opacity: 0.85 }}>
                    {d}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
            <button
              type="button"
              style={{
                width: '100%',
                height: 46,
                borderRadius: 11,
                background: '#0A0A0A',
                border: 'none',
                color: '#FFF',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Mute for this trip
            </button>
          </div>
        </Phone>

        {/* phone 3 */}
        <Phone caption="3 · Following your report" bg="#FFFFFF">
          <ThemeProvider value="light">
          <div style={{ padding: '38px 16px 0', color: color.c.ink }}>
            <span className="mono" style={{ color: color.c.muted }}>
              GMC-W32-2461
            </span>
            <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.028em', marginTop: 8, lineHeight: 1.15 }}>
              Pothole on G.S. Road, Ganeshguri
            </div>
            <p className="tiny" style={{ color: color.c.muted, marginTop: 7 }}>
              You and 46 other drivers passed over this.
            </p>
            <div
              style={{
                marginTop: 14,
                border: `1px solid ${color.c.line}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <EvidenceFrame width={310} height={168} kind="pothole" seed={73} radius={0} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                }}
              >
                <span className="tiny" style={{ color: color.c.muted }}>
                  Latest pass · 2 Sep, 08:14
                </span>
                <Chip tone="red">Still there</Chip>
              </div>
            </div>

            <div style={{ marginTop: 16, position: 'relative', paddingLeft: 20 }}>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  bottom: 12,
                  width: 0,
                  borderLeft: `1px dashed ${color.c.border}`,
                }}
              />
              {LADDER.map((s) => (
                <div key={s.label} style={{ position: 'relative', padding: '0 0 13px' }}>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: 3,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: s.tone,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: s.bold ? 600 : 500,
                      color: s.red ? color.red : color.c.ink,
                      letterSpacing: '-0.011em',
                    }}
                  >
                    {s.label}
                  </div>
                  <div className="tiny" style={{ color: color.c.dim, marginTop: 2 }}>
                    {s.when}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 20, display: 'flex', gap: 10 }}>
            <Btn style={{ flex: 1, justifyContent: 'center', height: 44, borderRadius: 11 }}>Share</Btn>
            <Btn primary style={{ flex: 1, justifyContent: 'center', height: 44, borderRadius: 11 }}>
              Following
            </Btn>
          </div>
          </ThemeProvider>
        </Phone>
      </div>
    </div>
  );
}
