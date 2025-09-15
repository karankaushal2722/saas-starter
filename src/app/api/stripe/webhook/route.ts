// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // IMPORTANT: keep this in sync with the types on Vercel
  apiVersion: "2023-10-16",
});

function bufferToText(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("utf8");
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.arrayBuffer();
  const textBody = bufferToText(rawBody);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      textBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        // Add your fulfillment logic here
        console.log("checkout.session.completed", event.id);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        console.log(event.type, event.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// Optional: allow GET so you can quickly ping the route in the browser
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/stripe/webhook", method: "POST only" });
}
