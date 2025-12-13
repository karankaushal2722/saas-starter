import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  // -----------------------------
  // DEMO MODE (no signature check)
  // -----------------------------
  if (demoMode) {
    try {
      event = (await req.json()) as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: accepted event without signature verification");
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    // -----------------------------
    // REAL MODE (verify signature)
    // -----------------------------
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("[Stripe webhook] Signature verification failed:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, { status: 400 });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  // -----------------------------
  // HANDLE EVENTS
  // -----------------------------
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.uid ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        if (!userId || !subscriptionId) {
          console.warn("[Stripe webhook] Missing uid or subscriptionId");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const priceId =
          subscription.items.data[0]?.price?.id ?? null;

        // ✅ IMPORTANT FIX:
        // Stripe no longer exposes current_period_end directly
        const periodEnd =
          subscription.current_period?.end
            ? new Date(subscription.current_period.end * 1000)
            : null;

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEnd,
          },
        });

        console.log("[Stripe webhook] User billing updated:", userId);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : null;

        if (!customerId) break;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) break;

        const priceId =
          subscription.items.data[0]?.price?.id ?? null;

        const periodEnd =
          subscription.current_period?.end
            ? new Date(subscription.current_period.end * 1000)
            : null;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEnd,
          },
        });

        console.log("[Stripe webhook] Subscription synced for user:", user.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : null;

        if (!customerId) break;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });

        console.log("[Stripe webhook] Subscription removed for customer:", customerId);
        break;
      }

      default:
        console.log("[Stripe webhook] Unhandled event type:", event.type);
    }
  } catch (err: any) {
    console.error("[Stripe webhook] Handler error:", err?.message);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
