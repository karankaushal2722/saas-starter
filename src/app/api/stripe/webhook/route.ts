// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";        // run in Node, not Edge
export const dynamic = "force-dynamic"; // disable caching for this route

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  console.error("[Stripe webhook] STRIPE_SECRET_KEY is not set");
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

if (!demoMode && !webhookSecret) {
  console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
  throw new Error(
    "STRIPE_WEBHOOK_SECRET is not set in environment variables (required when DEMO_MODE=false)."
  );
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  if (demoMode) {
    // DEMO MODE: skip signature verification completely
    try {
      const json = await req.json();
      console.log(
        "[Stripe webhook] DEMO_MODE: using req.json() directly, no signature check"
      );
      event = json as Stripe.Event;
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE: failed to parse JSON:", err);
      return new NextResponse("Invalid JSON body in demo mode", {
        status: 400,
      });
    }
  } else {
    // REAL MODE: verify the Stripe signature
    const sig = req.headers.get("stripe-signature");
    console.log("[Stripe webhook] stripe-signature header:", sig);

    if (!sig) {
      console.error("[Stripe webhook] Missing stripe-signature header");
      return new NextResponse("Missing stripe-signature header", {
        status: 400,
      });
    }

    try {
      const body = await req.text(); // RAW body
      console.log("[Stripe webhook] Raw body length:", body.length);

      event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
    } catch (err: any) {
      console.error(
        "[Stripe webhook] Signature verification failed:",
        err?.message
      );
      return new NextResponse(
        `Webhook Error: ${err?.message ?? "Signature verification failed"}`,
        { status: 400 }
      );
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  try {
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
        // TODO: update DB with subscription info
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          "[Stripe webhook] subscription event:",
          event.type,
          "id=",
          subscription.id
        );
        // TODO: update DB here
        break;
      }

      default:
        console.log("[Stripe webhook] Unhandled event type:", event.type);
    }

    console.log("==== STRIPE WEBHOOK END ====");
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
