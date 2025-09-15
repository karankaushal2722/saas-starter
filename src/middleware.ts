// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const uid = req.cookies.get('uid')?.value;

  if (!uid) {
    const newUid = crypto.randomUUID();
    res.cookies.set('uid', newUid, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  return res;
}

// Run on everything except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
