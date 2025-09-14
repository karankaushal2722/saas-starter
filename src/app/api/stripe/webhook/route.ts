// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // required for raw-body access on Vercel

// Stripe requires the raw body to verify the signature
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Missing Stripe signature/secret" },
      { status: 400 }
    );
  }

  // No apiVersion override here (fixes the build error)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Get raw body
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle the events you care about
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ checkout.session.completed", event.id);
        break;
      case "customer.subscription.created":
        console.log("✅ customer.subscription.created", event.id);
        break;
      case "customer.subscription.updated":
        console.log("✅ customer.subscription.updated", event.id);
        break;
      case "customer.subscription.deleted":
        console.log("✅ customer.subscription.deleted", event.id);
        break;
      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Handy GET response for quick sanity checks in a browser
  return NextResponse.json(
    { ok: true, route: "/api/stripe/webhook", method: "POST only" },
    { status: 200 }
  );
}
