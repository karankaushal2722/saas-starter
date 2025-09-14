// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // You can look up or create a customer as you already did — omitted here for brevity
    // Assume you have a valid `customerId` at this point:
    // const customerId = ...

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // line_items: [{ price: "price_XXXXX", quantity: 1 }],
      // customer: customerId,   // keep your logic
      // customer_email: email,  // or use this if no customer yet
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      // ... any other params you already set (allow_promotion_codes, trial settings, etc)
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
