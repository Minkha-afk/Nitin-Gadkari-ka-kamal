'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import FilterGroup, { useFilterState } from '@/components/chrome/FilterGroup';
import SidePanel from '@/components/chrome/SidePanel';
import { Main, PageHead } from '@/components/system/Page';
import { Btn, Chip, KpiTile, Panel, PanelBody, PanelHead } from '@/components/system';
import EvidenceFrame from '@/components/data/EvidenceFrame';
import { useRole } from '@/components/chrome/RoleContext';
import { VERIFY_CARDS, VERIFY_LOG } from '@/lib/fixtures/verification';
import { color } from '@/lib/tokens';

const TH: React.CSSProperties = {
  color: color.a.muted,
  padding: '0 10px 10px',
  borderBottom: `1px solid ${color.a.line}`,
};
const TD: React.CSSProperties = {
  padding: '10px',
  borderBottom: `1px solid ${color.a.lineSoft}`,
  color: color.a.ink2,
};

function Passes({
  done,
  required,
  onPass,
}: {
  done: number;
  required: number;
  onPass: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
      <span className="lbl" style={{ color: color.a.muted }}>
        Clean passes
      </span>
      <span style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: required }, (_, i) => {
          const on = i < done;
          return (
            <span
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `1px solid ${on ? '#123024' : color.a.border}`,
                background: on ? 'rgba(18,183,106,.10)' : 'transparent',
                color: on ? color.greenLift : color.a.dim,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {i + 1}
            </span>
          );
        })}
      </span>
      <span className="tiny" style={{ color: color.a.muted }}>
        {done} of {required}
      </span>
      <span style={{ flex: 1 }} />
      <Btn small onClick={onPass} disabled={done >= required}>
        Mark clean pass
      </Btn>
    </div>
  );
}

export default function VerificationPage() {
  const { role } = useRole();
  const [selected, setSelected] = useState(role.selected);
  const st = useFilterState(['waiting', 'ready', 'reopened']);
  const [passes, setPasses] = useState(VERIFY_CARDS.map((c) => c.done));

  return (
    <>
      <Sidebar>
        <JurisdictionTree selected={selected} onSelect={setSelected} />
        <FilterGroup
          title="Verification state"
          checked={st.checked}
          onToggle={st.toggle}
          items={[
            { id: 'waiting', label: 'Waiting for passes', count: 8 },
            { id: 'ready', label: 'Verified, ready to close', count: 5 },
            { id: 'reopened', label: 'Reopened', count: 2 },
            { id: 'none', label: 'No vehicle passed yet', count: 3 },
          ]}
        />
        <SidePanel title="Why this matters">
          <p className="sub" style={{ color: color.a.muted, fontSize: 12.5 }}>
            A ticket cannot be closed by claiming it is fixed. The next vehicles to drive over the
            spot decide. If damage is still detected, the ticket reopens and the contractor is
            flagged.
          </p>
        </SidePanel>
      </Sidebar>

      <Main>
        <PageHead
          title="Closure verified by traffic"
          sub="Repairs marked done are provisional until vehicles confirm the road is clean."
          right={<Btn>Verification rules</Btn>}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
          <KpiTile label="Awaiting passes" value={8} tone="blue" sub="average wait 1.4 days" />
          <KpiTile label="Verified and closed" value={23} tone="green" sub="this month" />
          <KpiTile label="Reopened after repair" value={2} tone="red" sub="contractors flagged" />
          <KpiTile label="Repairs that held 90 days" value="88%" tone="green" sub="warranty window" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
          {VERIFY_CARDS.map((c, i) => (
            <Panel key={c.id}>
              <PanelHead
                title={c.road}
                sub={undefined}
                right={<Chip tone={c.chip.tone}>{c.chip.text}</Chip>}
                style={{ paddingBottom: 11 }}
              />
              <div className="mono" style={{ color: color.a.dim, padding: '0 18px 11px', marginTop: -8 }}>
                {c.id}
              </div>
              <PanelBody style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <EvidenceFrame width={158} height={100} kind="pothole" seed={30 + i} radius={8} style={{ width: '100%' }} />
                    <div className="tiny" style={{ color: color.a.dim, marginTop: 6 }}>
                      Before · {c.before}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <EvidenceFrame
                      width={158}
                      height={100}
                      kind={c.afterKind}
                      seed={40 + i}
                      radius={8}
                      boxes={c.afterBoxes ? [{ label: 'Pothole .92' }] : undefined}
                      style={{ width: '100%' }}
                    />
                    <div className="tiny" style={{ color: color.a.dim, marginTop: 6 }}>
                      After · {c.after}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Passes
                    done={passes[i]}
                    required={c.required}
                    onPass={() =>
                      setPasses((p) => p.map((v, j) => (j === i ? Math.min(c.required, v + 1) : v)))
                    }
                  />
                </div>
                <p className="tiny" style={{ color: color.a.muted, marginTop: 12, lineHeight: 1.5 }}>
                  {c.note}
                </p>
              </PanelBody>
            </Panel>
          ))}
        </div>

        <Panel flush style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHead
            title="Recent verification decisions"
            right={
              <span className="tiny" style={{ color: color.a.dim }}>
                Machine decided, logged in the audit chain
              </span>
            }
          />
          <div className="scrollarea" style={{ flex: 1, minHeight: 0, padding: '10px 8px 6px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={TH}>Ticket</th>
                  <th scope="col" style={TH}>Road</th>
                  <th scope="col" style={TH}>Decided</th>
                  <th scope="col" style={{ ...TH, textAlign: 'right' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {VERIFY_LOG.map((v, i) => (
                  <tr key={`${v.id}-${i}`}>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.ink }}>
                        {v.id}
                      </span>
                    </td>
                    <td style={TD}>{v.road}</td>
                    <td style={TD}>
                      <span className="mono" style={{ color: color.a.dim }}>
                        {v.at}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <Chip tone={v.tone}>{v.result}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Main>
    </>
  );
}
