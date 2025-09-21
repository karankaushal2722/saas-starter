import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // disable edge; we need raw body

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16"
  });

  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  try {
    if (!sig || !whSecret) throw new Error("Missing Stripe webhook secret or signature");

    const event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);

    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ checkout.session.completed", event.id);
        break;
      case "customer.subscription.created":
        console.log("ℹ️ subscription.created", event.id);
        break;
      case "invoice.paid":
        console.log("ℹ️ invoice.paid", event.id);
        break;
      default:
        console.log("Unhandled event", event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/stripe/webhook", method: "POST only" });
}
