// src/app/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Build the base URL of your deployed app
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers.get("x-forwarded-proto") ?? "https"}://${req
        .headers.get("host")!
        .trim()}`;

    // Create a Stripe instance (no apiVersion override -> fixes the build error)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Create a Checkout Session (subscription)
    // Make sure STRIPE_PRICE_ID is set in your env (a recurring price ID)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: email, // or use your own customer lookup/creation logic
      success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/checkout/cancel`,
      // add other options you need: allow_promotion_codes, trial settings, etc.
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// Optional: friendly GET so you can hit this route in a browser and see it's live
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { ok: true, where: "/api/billing/checkout", method: "GET" },
    { status: 200 }
  );
}
