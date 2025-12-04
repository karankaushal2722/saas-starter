// src/lib/supabaseServer.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function supabaseServer() {
  // Some Next 16 type defs make this look like a Promise; we cast to any to keep TS happy
  const cookieStore = cookies() as any

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // No-ops for now; you can wire these when you need to set cookies from route handlers
        set() {},
        remove() {},
      },
    }
  )
}
