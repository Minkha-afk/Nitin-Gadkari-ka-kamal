/**
 * Deterioration watch — what repeated passes over the same road have shown.
 *
 * This is deliberately not called a forecast. Predicting when a road will fail
 * needs a condition index tracked over months; what the database holds is
 * re-sightings, which say what is getting worse now, not what will fail in
 * March. The page says so rather than dressing the gap up in a model.
 */

import ForecastClient from '@/components/authority/ForecastClient';
import { getDeterioration, scopeName, selectedScope } from '@/lib/authority';

export const dynamic = 'force-dynamic';

export default async function ForecastPage() {
  const scope = await selectedScope();
  const [data, label] = await Promise.all([getDeterioration(scope), scopeName(scope)]);
  return <ForecastClient data={data} scopeLabel={label} />;
}
