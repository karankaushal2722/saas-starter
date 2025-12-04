// src/app/api/health/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: any = {}

  // DB test
  try {
    const [row] = await prisma.$queryRawUnsafe<{ now: string }[]>('select now()')
    checks.db = { ok: true, now: row.now }
  } catch (err: any) {
    checks.db = { ok: false, error: err.message }
  }

  // ENV test
  checks.env = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    DIRECT_URL: process.env.DIRECT_URL ? 'set' : 'missing',
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'missing',
  }

  const ok = checks.db.ok

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 })
}
