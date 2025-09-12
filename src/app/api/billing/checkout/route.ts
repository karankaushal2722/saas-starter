// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Omit apiVersion to avoid type/version mismatches on build
});

function absoluteReturnUrl(req: NextRequest, path = "/") {
  // Prefer NEXT_PUBLIC_SITE_URL if you set it; otherwise infer from request
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  return new URL(path, base).toString();
}

async function getOrCreateCustomer(email: string) {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];
  return await stripe.customers.create({ email });
}

export async function GET() {
  // simple readiness signal
  return NextResponse.json({ ok: true, where: "/api/billing/checkout", method: "GET" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email =
      body?.email ||
      req.headers.get("x-user-email") ||
      req.headers.get("x-email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing email (send JSON {email} or x-user-email header)" },
        { status: 400 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "STRIPE_PRICE_ID not set" }, { status: 500 });
    }

    const customer = await getOrCreateCustomer(email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      success_url: absoluteReturnUrl(req, "/?checkout=success"),
      cancel_url: absoluteReturnUrl(req, "/?checkout=cancel"),
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        metadata: { appUserEmail: email },
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error", err);
    return NextResponse.json({ error: err?.message || "Checkout error" }, { status: 500 });
  }
}

