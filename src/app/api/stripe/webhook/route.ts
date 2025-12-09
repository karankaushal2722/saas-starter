// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";        // run in Node, not Edge
export const dynamic = "force-dynamic"; // no caching

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Stripe client is optional here (we only need it later if we want to
// fetch more data). For now, we mostly just parse the event body.
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null;

export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START (NO SIGNATURE CHECK) ====");

  let event: Stripe.Event;

  try {
    // IMPORTANT:
    // We are *not* doing signature verification here.
    // We just trust the JSON body Stripe sends us.
    const json = await req.json();
    console.log("[Stripe webhook] Parsed JSON body.");
    event = json as Stripe.Event;
  } catch (err: any) {
    console.error("[Stripe webhook] Failed to parse JSON body:", err);
    return new NextResponse("Invalid JSON body", { status: 400 });
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
        // TODO: update your DB with subscription info if you want
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
        // TODO: update your DB if you want
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
