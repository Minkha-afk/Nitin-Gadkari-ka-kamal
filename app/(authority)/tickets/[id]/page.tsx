/** One ticket: its evidence, its history, and what can be done to it next. */

import { notFound } from 'next/navigation';
import TicketDetailClient from '@/components/authority/TicketDetailClient';
import { getTicketDetail } from '@/lib/authority';
import { allowedActions } from '@/lib/tickets';
import type { TicketState } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTicketDetail(id);
  if (!detail) notFound();
  return (
    <TicketDetailClient
      detail={detail}
      actions={allowedActions(detail.ticket.state as TicketState)}
    />
  );
}
