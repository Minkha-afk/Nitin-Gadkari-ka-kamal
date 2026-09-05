/** Reading the device cookie from a server component or route handler. */

import { cookies } from 'next/headers';

export const DEVICE_COOKIE = 'rs_device';

export async function deviceId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DEVICE_COOKIE)?.value ?? null;
}
