'use client';

import React from 'react';
import Sidebar from '@/components/chrome/Sidebar';
import JurisdictionTree from '@/components/chrome/JurisdictionTree';
import { Main, PageHead } from '@/components/system/Page';
import { Inset, KpiRow, KpiTile, Panel, PanelHead } from '@/components/system';
import { NotConfigured, TicketTable } from './bits';
import type { TicketRow } from '@/lib/authority';
import { color } from '@/lib/tokens';

export default function VerificationClient({
  awaiting,
  verified,
  reopened,
  configured,
  scopeLabel,
}: {
  awaiting: TicketRow[];
  verified: TicketRow[];
  reopened: TicketRow[];
  configured: boolean;
  scopeLabel: string;
}) {
  return (
    <>
      <Sidebar>
        <div>
          <div className="lbl" style={{ color: color.a.muted, marginBottom: 8 }}>Jurisdiction</div>
          <JurisdictionTree />
        </div>
        <Inset>
          <p className="tiny" style={{ color: color.a.dim, lineHeight: 1.6, margin: 0 }}>
            Repair and verification are deliberately separate states. The contractor says the work is
            done; somebody else says it actually is. A ticket that comes back becomes{' '}
            <strong style={{ color: color.redLift }}>reopened</strong>, and that is the number that says
            most about a contractor.
          </p>
        </Inset>
      </Sidebar>

      <Main wide>
        <PageHead title="Verification queue" sub={scopeLabel} />
        {!configured ? <NotConfigured /> : null}

        <KpiRow>
          <KpiTile label="Waiting on you" value={awaiting.length} tone={awaiting.length ? 'amber' : undefined} sub="marked repaired" />
          <KpiTile label="Verified" value={verified.length} tone={verified.length ? 'green' : undefined} />
          <KpiTile label="Came back" value={reopened.length} tone={reopened.length ? 'red' : undefined} sub="reopened after repair" />
          <KpiTile label="In scope" value={awaiting.length + verified.length + reopened.length} />
          <KpiTile
            label="Repeat rate"
            value={
              verified.length + reopened.length
                ? `${Math.round((reopened.length / (verified.length + reopened.length)) * 100)}%`
                : '—'
            }
            sub="of finished work that failed"
          />
        </KpiRow>

        <Panel flush>
          <PanelHead title="Marked repaired, not yet verified" sub="Open one to verify or reopen it" />
          <TicketTable
            rows={awaiting}
            showLevel={false}
            emptyNote="Nothing is waiting on verification. Work reaches this queue once a contractor marks it repaired."
          />
        </Panel>

        <Panel flush>
          <PanelHead title="Came back after repair" />
          <TicketTable rows={reopened} showLevel={false} emptyNote="No repaired road has failed again." />
        </Panel>
      </Main>
    </>
  );
}
