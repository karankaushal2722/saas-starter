import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma =
  (globalThis as any).prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!(globalThis as any).prisma) (globalThis as any).prisma = prisma;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");

// Only require webhook secret when NOT in demo mode
if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

function pickUidFromEvent(event: Stripe.Event): string | null {
  // We try a few common places where apps store the logged-in user id
  const obj: any = (event.data as any)?.object;

  // checkout.session.completed often includes metadata
  const meta = obj?.metadata || {};
  return (
    meta.uid ||
    meta.userId ||
    meta.profileId ||
    obj?.client_reference_id ||
    null
  );
}

async function findUserIdFallback(event: Stripe.Event): Promise<string | null> {
  const obj: any = (event.data as any)?.object;

  const email =
    obj?.customer_details?.email ||
    obj?.customer_email ||
    obj?.receipt_email ||
    null;

  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  return user?.id ?? null;
}

async function upsertBillingOnUser(params: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}) {
  const {
    userId,
    stripeCustomerId = null,
    stripeSubscriptionId = null,
    stripePriceId = null,
    stripeCurrentPeriodEnd = null,
  } = params;

  await prisma.user.update({
    where: { id: userId },
    data: {
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

  // 1) Parse + verify event
  if (demoMode) {
    try {
      const json = await req.json();
      event = json as Stripe.Event;
      console.log("[Stripe webhook] DEMO_MODE: accepted event without signature verification");
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE: invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 });

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("[Stripe webhook] Signature verify failed:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, { status: 400 });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  // 2) Handle relevant events
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // subscription purchase
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      let userId = pickUidFromEvent(event);
      if (!userId) userId = await findUserIdFallback(event);

      if (!userId) {
        console.warn("[Stripe webhook] No userId found (metadata/client_reference_id/email). Skipping DB update.");
        return NextResponse.json({ received: true });
      }

      if (!subscriptionId) {
        // Could be one-time payment; if you want to handle those later, do it here.
        console.log("[Stripe webhook] checkout.session.completed without subscription (one-time?). ACK only.");
        return NextResponse.json({ received: true });
      }

      // Retrieve subscription to get price + period end
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      const subAny: any = sub as any;
      const priceId: string | null =
        subAny?.items?.data?.[0]?.price?.id ?? null;

      const periodEndUnix: number | null =
        typeof subAny?.current_period_end === "number" ? subAny.current_period_end : null;

      const periodEndDate: Date | null =
        periodEndUnix ? new Date(periodEndUnix * 1000) : null;

      await upsertBillingOnUser({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: periodEndDate,
      });

      console.log("[Stripe webhook] Updated billing fields for user:", userId);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const subAny: any = subscription as any;
      const subscriptionId = subscription.id;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

      const priceId: string | null =
        subAny?.items?.data?.[0]?.price?.id ?? null;

      const periodEndUnix: number | null =
        typeof subAny?.current_period_end === "number" ? subAny.current_period_end : null;

      const periodEndDate: Date | null =
        periodEndUnix ? new Date(periodEndUnix * 1000) : null;

      // We still need to map this event to a user.
      // Prefer metadata uid if you add it; otherwise we try email fallback.
      let userId = pickUidFromEvent(event);
      if (!userId) userId = await findUserIdFallback(event);

      if (!userId) {
        console.warn("[Stripe webhook] subscription.* event: no userId found. Skipping DB update.");
        return NextResponse.json({ received: true });
      }

      // If deleted, clear subscription fields
      const isDeleted = event.type === "customer.subscription.deleted";

      await upsertBillingOnUser({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: isDeleted ? null : subscriptionId,
        stripePriceId: isDeleted ? null : priceId,
        stripeCurrentPeriodEnd: isDeleted ? null : periodEndDate,
      });

      console.log("[Stripe webhook] Synced subscription event to user:", userId);
    }
  } catch (err: any) {
    console.error("[Stripe webhook] Handler error:", err?.message);
    // return 200 so Stripe doesn’t retry forever if your handler had a non-critical failure
    return NextResponse.json({ received: true });
  }

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
