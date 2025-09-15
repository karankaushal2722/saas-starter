// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // IMPORTANT: keep this in sync with the types on Vercel
  apiVersion: "2023-10-16",
});

function resolveAppUrl(req: NextRequest): string {
  // Use your live domain on Vercel if NEXT_PUBLIC_BASE_URL is absent
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/billing/checkout" });
}

export async function POST(req: NextRequest) {
  try {
    const appUrl = resolveAppUrl(req);

    // If you need to accept an email, you can read it from the body:
    // const { email } = await req.json();

    // Minimal subscription session; swap price with your actual price ID
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // e.g. price_XXXX
          quantity: 1,
        },
      ],
      // If you track customers yourself, pass `customer` or `customer_email` here.
      success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
