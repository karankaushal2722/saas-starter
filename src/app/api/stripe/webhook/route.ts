// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text(); // raw string body
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✔ checkout.session.completed", event.id);
        break;
      case "customer.subscription.created":
        console.log("✔ subscription created", event.id);
        break;
      case "customer.subscription.updated":
        console.log("✔ subscription updated", event.id);
        break;
      case "invoice.payment_succeeded":
        console.log("✔ invoice paid", event.id);
        break;
      default:
        console.log("ℹ unhandled event", event.type);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
