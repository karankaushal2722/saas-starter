// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

function getBaseUrl(req: NextRequest) {
  // Prefer the vercel-provided host so success/cancel URLs are correct
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET() {
  // Sanity ping
  return NextResponse.json({ ok: true, where: "/api/billing/checkout", method: "GET" });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Ensure customer exists (create if missing)
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      customers.data[0] ??
      (await stripe.customers.create({
        email,
        // You can attach metadata here to map to your user id
      }));

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "STRIPE_PRICE_ID not set" }, { status: 500 });
    }

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Checkout failed" },
      { status: 500 }
    );
  }
}
