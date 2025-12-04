// src/app/api/billing/portal/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function resolveAppUrl(req: NextRequest): string {
  const host = req.headers.get('host') ?? 'localhost:3000';
  const proto = process.env.VERCEL ? 'https' : 'http';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    const origin = resolveAppUrl(req);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl ?? `${origin}/billing`,
    });

    return NextResponse.json({ url: portal.url }, { status: 200 });
  } catch (err: any) {
    console.error('Portal error:', err?.message);
    return NextResponse.json({ error: 'Portal failed' }, { status: 500 });
  }
}
