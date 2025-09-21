import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
});

function resolveAppUrl(req: NextRequest): string {
  const h = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${h}`;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/billing/checkout" });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    const appUrl = resolveAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Attach your test price:
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/checkout/cancel`,
      customer_email: email
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
