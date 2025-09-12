// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // Stripe needs the Node runtime on Vercel

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Optional: keep GET for quick checks
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/stripe/webhook" });
}

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
    // IMPORTANT: raw body as text for signature verification
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // 🔧 Handle the events you care about
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // TODO: activate the user's subscription / save to DB
        console.log("✅ checkout.session.completed", session.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // TODO: sync subscription status to your DB
        console.log(`✅ ${event.type}`, sub.id, sub.status);
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        console.log("✅ invoice.paid", inv.id);
        break;
      }

      default:
        // Log everything else for now
        console.log(`ℹ️  Unhandled event: ${event.type}`);
    }
  } catch (err: any) {
    // If your business logic throws, return 500 so Stripe can retry
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  // Acknowledge receipt
  return NextResponse.json({ received: true, type: event.type });
}
