import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");

// Only require webhook secret when NOT in demo mode
if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  if (demoMode) {
    // DEMO MODE: do not verify signature (Stripe Dashboard / tools may not preserve raw body)
    try {
      const json = await req.json();
      event = json as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: accepted event without signature verification");
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE: invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    // REAL MODE: verify Stripe signature
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("Webhook error:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, { status: 400 });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  // NOTE: You can add DB writes here later. For now we just ACK to stop retries.
  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
