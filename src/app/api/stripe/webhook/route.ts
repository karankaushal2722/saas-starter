import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // required for raw body parsing on Vercel

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Missing Stripe signature/secret" },
      { status: 400 }
    );
  }

  const body = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(body), sig, secret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle events
  try {
    switch (event.type) {
      case "customer.subscription.created":
        console.log("✅ Subscription created:", event.data.object);
        break;
      case "invoice.payment_succeeded":
        console.log("✅ Invoice paid:", event.data.object);
        break;
      case "customer.subscription.deleted":
        console.log("❌ Subscription canceled:", event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Optional GET just for sanity check
export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/stripe/webhook", method: "POST only" });
}
