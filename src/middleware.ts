// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Creates a Supabase client bound to the middleware's request/response
  const supabase = createMiddlewareClient({ req, res })

  // Optionally refresh session; ignore errors to keep requests flowing
  await supabase.auth.getSession().catch(() => {})

  return res
}

// Match paths you actually want; start simple:
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
