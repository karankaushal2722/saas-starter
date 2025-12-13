import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // Required for Stripe webhooks

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");
if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
    }

  const rawBody = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  console.log("Webhook received:", event.type);

  return NextResponse.json({ received: true });
}
