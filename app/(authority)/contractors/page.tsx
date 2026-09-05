/** The contractor panel, with load and repeat-work measured from real tickets. */

import ContractorsClient from '@/components/authority/ContractorsClient';
import { getContractors } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  const { rows, configured } = await getContractors();
  return <ContractorsClient rows={rows} configured={configured} />;
}
