// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("[Stripe webhook] STRIPE_SECRET_KEY is not set");
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

// We still init Stripe so we can reuse types if needed
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

/**
 * IMPORTANT:
 * This version does NOT verify the Stripe signature.
 * ONLY use this in TEST / DEV mode while you get the rest of your app working.
 * Before production, we will re-enable constructEvent + STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK (NO-SIG) START ====");

  try {
    const json = await req.json();
    console.log("[Stripe webhook] Raw event JSON:", JSON.stringify(json, null, 2));

    // In this “no-sig” mode, we trust the payload structure.
    const event = json as Stripe.Event;

    console.log("[Stripe webhook] Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          "[Stripe webhook] checkout.session.completed:",
          "session.id=",
          session.id,
          "customer=",
          session.customer,
          "subscription=",
          session.subscription
        );
        // TODO: update your DB with subscription info (user plan, status, etc.)
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          "[Stripe webhook] subscription event:",
          event.type,
          "id=",
          subscription.id,
          "status=",
          subscription.status
        );
        // TODO: update DB subscription status for this customer
        break;
      }

      default:
        console.log("[Stripe webhook] Unhandled event type:", event.type);
    }

    console.log("==== STRIPE WEBHOOK (NO-SIG) END ====");
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Error parsing / handling event:", err?.message);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
