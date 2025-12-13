import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * REQUIRED: Stripe webhooks must run in Node
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENV
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Only require webhook secret if NOT in demo mode
if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required when DEMO_MODE=false");
}

/**
 * STRIPE CLIENT
 */
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

/**
 * WEBHOOK HANDLER
 */
export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  /**
   * DEMO MODE
   * Skip signature verification (Stripe dashboard resend breaks raw body)
   */
  if (demoMode) {
    try {
      const body = await req.json();
      event = body as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: event accepted without signature verification");
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE JSON error:", err?.message);
      return new NextResponse("Invalid JSON body", { status: 400 });
    }
  } else {
    /**
     * REAL MODE
     * Verify Stripe signature
     */
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret!
      );
    } catch (err: any) {
      console.error("[Stripe webhook] Signature verification failed:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, { status: 400 });
    }
  }

  /**
   * EVENT RECEIVED
   */
  console.log("[Stripe webhook] Event type:", event.type);

  /**
   * IMPORTANT:
   * Do NOT write to DB yet.
   * This keeps builds safe and avoids partial failures.
   *
   * We will add DB sync AFTER everything is green.
   */

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
