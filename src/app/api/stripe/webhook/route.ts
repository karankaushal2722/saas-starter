import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force Node.js runtime (NOT Edge) for Stripe webhooks
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("❌ Missing Stripe signature or webhook secret", {
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
    });

    return NextResponse.json(
      { error: "Missing signature or webhook secret." },
      { status: 400 }
    );
  }

  // Get the raw body as text so Stripe can verify it
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification error:", err.message);
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${err.message}`,
      },
      { status: 400 }
    );
  }

  console.log("✅ Stripe webhook received:", {
    type: event.type,
    id: event.id,
  });

  // Handle the events you care about
  switch (event.type) {
    case "checkout.session.completed": {
      console.log("🎉 Checkout session completed");
      break;
    }
    case "customer.subscription.created": {
      console.log("📦 Subscription created");
      break;
    }
    case "customer.subscription.updated": {
      console.log("🔁 Subscription updated");
      break;
    }
    case "customer.subscription.deleted": {
      console.log("❌ Subscription canceled");
      break;
    }
    default: {
      console.log("ℹ️ Unhandled event type:", event.type);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
