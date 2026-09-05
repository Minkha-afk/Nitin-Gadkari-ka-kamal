/**
 * Detection quality — what the detector has actually produced, plus what the
 * ML service reports about itself right now.
 *
 * No accuracy claims are printed here that this app cannot see for itself.
 * mAP and recall are properties of the held-out test set, measured in the ML
 * repo, not something the running service can report.
 */

import ModelClient from '@/components/authority/ModelClient';
import { getModelStats } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function ModelPage() {
  const stats = await getModelStats();
  return <ModelClient stats={stats} />;
}
