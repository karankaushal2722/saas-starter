// src/app/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // Stripe server SDK needs Node runtime

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    // Build your app's base URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;

    // ⚠️ You must attach either price/line_items OR a Price on the customer.
    // This example assumes you have a test price in Stripe called price_XXXX.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email, // or pass a customer id if you have it
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // set this in your env (e.g. price_123...)
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/checkout/cancel`,
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

