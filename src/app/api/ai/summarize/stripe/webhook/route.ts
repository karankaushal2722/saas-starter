import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";        // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic"; // allow raw body

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  try {
    // IMPORTANT: raw text body for signature verification
    const raw = await req.text();

    const event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle key events (we'll wire these up later)
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
        console.log("Stripe event:", event.type);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook verify error:", err?.message || err);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}

export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
