/**
 * Gives every browser a stable id.
 *
 * There is no login yet, but "my reports" has to mean something, so each
 * browser gets an opaque random id in a cookie and every upload is stamped
 * with it. It identifies a device, not a person — clearing cookies or using
 * another browser starts a new one, and that is the honest limit of it.
 *
 * Replace with a real session when accounts exist; the field name stays.
 */

import { NextRequest, NextResponse } from 'next/server';

export const DEVICE_COOKIE = 'rs_device';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(DEVICE_COOKIE)) {
    res.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  // Skip static assets and the ML proxy — the proxy streams video uploads and
  // has no use for the cookie.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/ml).*)'],
};
