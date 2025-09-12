// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // required for raw body on Vercel

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/stripe/webhook", method: "POST only" });
}

// Vercel/Next needs the raw body for signature verification
export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const raw = Buffer.from(await req.arrayBuffer());

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle events you care about
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ checkout.session.completed", event.id);
        break;
      case "invoice.payment_succeeded":
        console.log("💚 invoice.payment_succeeded", event.id);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        console.log(`🔁 ${event.type}`, event.id);
        break;
      default:
        console.log("ℹ️ unhandled event", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("webhook error", err);
    return NextResponse.json({ error: err?.message || "Webhook error" }, { status: 500 });
  }
}

