import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --------------------
// Prisma (singleton for Next.js)
// --------------------
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["error", "warn"], // uncomment if you want more logs
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --------------------
// Stripe
// --------------------
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");
if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

// --------------------
// Helpers
// --------------------
async function getEmailFromCustomerId(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !("deleted" in customer)) {
      return customer.email ?? null;
    }
  } catch (e) {
    console.error("[Stripe webhook] Failed to retrieve customer:", e);
  }
  return null;
}

async function upsertBillingOnUser(params: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}) {
  const {
    email,
    stripeCustomerId = null,
    stripeSubscriptionId = null,
    stripePriceId = null,
    stripeCurrentPeriodEnd = null,
  } = params;

  // We assume a profile row already exists for the user (created at signup).
  // If not, we can create it here.
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        stripeCustomerId: stripeCustomerId ?? existing.stripeCustomerId ?? null,
        stripeSubscriptionId,
        stripePriceId,
        stripeCurrentPeriodEnd,
      },
    });
    return;
  }

  // Create profile row if it doesn't exist yet
  await prisma.user.create({
    data: {
      email,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      stripeCurrentPeriodEnd,
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  // 1) Parse event
  if (demoMode) {
    // DEMO MODE: accept JSON payload (no signature)
    try {
      event = (await req.json()) as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: accepted event without signature verification");
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE: invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    // REAL MODE: verify signature
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("[Stripe webhook] Signature verification failed:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, { status: 400 });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  // 2) Handle event types that matter for billing
  try {
    switch (event.type) {
      // Best event to capture customer + subscription after checkout
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        const email =
          session.customer_details?.email ??
          session.customer_email ??
          (customerId ? await getEmailFromCustomerId(customerId) : null);

        if (!email) {
          console.warn("[Stripe webhook] No email found on checkout.session.completed");
          break;
        }

        // If we have a subscription, fetch it to get price + period end
        let priceId: string | null = null;
        let periodEnd: Date | null = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = sub.items.data?.[0]?.price?.id ?? null;
          periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        }

        await upsertBillingOnUser({
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: periodEnd,
        });

        console.log("[Stripe webhook] Updated billing for:", email);
        break;
      }

      // Subscription lifecycle (good to keep user in-sync)
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const subscriptionId = sub.id;
        const priceId = sub.items.data?.[0]?.price?.id ?? null;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

        const email = await getEmailFromCustomerId(customerId);
        if (!email) {
          console.warn("[Stripe webhook] No email found for customer:", customerId);
          break;
        }

        await upsertBillingOnUser({
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: periodEnd,
        });

        console.log("[Stripe webhook] Synced subscription for:", email);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const email = await getEmailFromCustomerId(customerId);
        if (!email) break;

        // Clear subscription fields on cancel
        await upsertBillingOnUser({
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        });

        console.log("[Stripe webhook] Cleared subscription for:", email);
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err: any) {
    console.error("[Stripe webhook] Handler error:", err?.message || err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
