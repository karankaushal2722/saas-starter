// src/app/api/billing/checkout/route.ts
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
    const { priceId, customerId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const origin = resolveAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      customer: customerId, // optional; pass when you have it
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('Checkout error:', err?.message);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
