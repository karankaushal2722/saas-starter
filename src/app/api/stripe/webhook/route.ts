// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force Node.js runtime (we need the raw request body)
export const runtime = "nodejs";

// ---- Stripe setup ----
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set in environment variables.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

// ---- Webhook handler ----
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[Stripe webhook] Missing stripe-signature header");
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ✅ VERY IMPORTANT: raw body, NOT req.json()
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe webhook] Signature verification failed:", err.message);
    return new NextResponse(
      `Webhook Error: ${err.message ?? "Signature verification failed"}`,
      { status: 400 }
    );
  }

  // At this point, the signature is valid and `event` is trustworthy.
  console.log("[Stripe webhook] Event received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log(
          "[Stripe webhook] checkout.session.completed:",
          session.id,
          "customer:",
          session.customer,
          "subscription:",
          session.subscription
        );

        // TODO: look up the user by session.client_reference_id or metadata
        // and store/update their subscription in your DB.

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Stripe webhook] subscription event:", event.type, subscription.id);

        // TODO: update subscription status in your DB.
        break;
      }

      default: {
        console.log(`[Stripe webhook] Unhandled event type: ${event.type}`);
      }
    }

    // Stripe just needs a 2xx to consider the webhook delivered.
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
