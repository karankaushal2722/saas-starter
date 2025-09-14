// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Compute your app's base URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;

    // TODO: Attach a price (or items/customer) as your logic requires.
    // Minimal skeleton—Stripe still needs a price/line_items or a price attached on the customer.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Example (uncomment & set your test price id):
      // line_items: [{ price: "price_xxx", quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
