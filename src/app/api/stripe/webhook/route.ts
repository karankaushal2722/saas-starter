import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

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

  // ---------------------------------------------------
  // 1️⃣ DEMO MODE (no signature verification)
  // ---------------------------------------------------
  if (demoMode) {
    try {
      event = (await req.json()) as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: accepted event without verification");
    } catch (err: any) {
      console.error("[Stripe webhook] Invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    // ---------------------------------------------------
    // 2️⃣ PRODUCTION MODE (signature verification)
    // ---------------------------------------------------
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("[Stripe webhook] Signature verification failed:", err.message);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  // ---------------------------------------------------
  // 3️⃣ SAFE EVENT HANDLING (NO DB WRITES YET)
  // ---------------------------------------------------
  if (event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated") {

    const subscription = event.data.object as Stripe.Subscription;

    const priceId =
      subscription.items?.data?.[0]?.price?.id ?? null;

    const periodEndUnix =
      typeof subscription.current_period_end === "number"
        ? subscription.current_period_end
        : null;

    const periodEndDate =
      periodEndUnix ? new Date(periodEndUnix * 1000) : null;

    console.log("[Stripe webhook] Subscription detected:", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      priceId,
      periodEndDate,
    });

    // ⛔ NO DB WRITE YET — we add this AFTER tables exist
  }

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
