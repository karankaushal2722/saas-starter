import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// -----------------------------------------------------------------------------
// Prisma (singleton for Next.js)
// -----------------------------------------------------------------------------
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// -----------------------------------------------------------------------------
// Stripe
// -----------------------------------------------------------------------------
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");
if (!demoMode && !webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)");
}

const stripe = new Stripe(stripeSecretKey, {
  // If TS complains on your machine, change this line to:
  // apiVersion: process.env.STRIPE_API_VERSION as any,
  apiVersion: "2025-10-29.clover",
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  // Stripe types can differ by version; read both shapes safely.
  const s: any = subscription;

  if (typeof s.current_period_end === "number") return s.current_period_end;
  if (typeof s.current_period?.end === "number") return s.current_period.end;

  return null;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription): string | null {
  const s: any = subscription;
  const priceId =
    s.items?.data?.[0]?.price?.id ??
    s.items?.data?.[0]?.plan?.id ??
    null;
  return typeof priceId === "string" ? priceId : null;
}

function getUidFromSession(session: Stripe.Checkout.Session): string | null {
  const s: any = session;

  // Prefer metadata.uid (best practice)
  const uid =
    s.metadata?.uid ??
    s.client_reference_id ??
    null;

  return typeof uid === "string" && uid.length ? uid : null;
}

function getEmailFromSession(session: Stripe.Checkout.Session): string | null {
  const s: any = session;

  const email =
    s.customer_details?.email ??
    s.customer_email ??
    s.metadata?.email ??
    null;

  return typeof email === "string" && email.length ? email : null;
}

// -----------------------------------------------------------------------------
// Webhook
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  // ---------------------------
  // DEMO MODE (no signature verify)
  // ---------------------------
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
    // ---------------------------
    // REAL MODE (verify signature with raw body)
    // ---------------------------
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

  try {
    // -------------------------------------------------------------------------
    // 1) Checkout completed -> attach customer/subscription to user profile
    // -------------------------------------------------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const uid = getUidFromSession(session);
      const email = getEmailFromSession(session);

      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof (session as any).subscription === "string"
          ? (session as any).subscription
          : (session as any).subscription?.id;

      console.log("[Stripe webhook] checkout.session.completed uid/email:", uid, email);
      console.log("[Stripe webhook] customer/subscription:", customerId, subscriptionId);

      // If we can't identify the user, we can't write billing fields.
      if (!uid && !email) {
        console.warn("[Stripe webhook] Missing uid/email on session; skipping DB write");
        return NextResponse.json({ received: true });
      }

      let stripePriceId: string | null = null;
      let stripeCurrentPeriodEnd: Date | null = null;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });

        stripePriceId = getSubscriptionPriceId(subscription);
        const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);
        stripeCurrentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;
      }

      // Write to Prisma (public.profiles via @@map("profiles"))
      // We try by id first if uid exists; otherwise fallback to email.
      if (uid) {
        // If your profiles row already exists (common with Supabase),
        // update will work; if not, upsert creates it.
        await prisma.user.upsert({
          where: { id: uid },
          create: {
            id: uid,
            email: email ?? `missing-email+${uid}@example.com`,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripePriceId,
            stripeCurrentPeriodEnd,
          },
          update: {
            ...(email ? { email } : {}),
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripePriceId,
            stripeCurrentPeriodEnd,
          },
        });
      } else if (email) {
        await prisma.user.upsert({
          where: { email },
          create: {
            email,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripePriceId,
            stripeCurrentPeriodEnd,
          },
          update: {
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripePriceId,
            stripeCurrentPeriodEnd,
          },
        });
      }

      console.log("[Stripe webhook] DB updated for checkout.session.completed");
    }

    // -------------------------------------------------------------------------
    // 2) Subscription changed -> keep plan fields in sync
    // -------------------------------------------------------------------------
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const subscriptionId = subscription.id;

      const stripePriceId = getSubscriptionPriceId(subscription);
      const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);
      const stripeCurrentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

      // Find user by stripeCustomerId
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });

      if (!user) {
        console.warn("[Stripe webhook] No user found for stripeCustomerId:", customerId);
        return NextResponse.json({ received: true });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeSubscriptionId: subscriptionId ?? null,
          stripePriceId,
          stripeCurrentPeriodEnd,
        },
      });

      console.log("[Stripe webhook] DB updated for subscription event:", event.type);
    }

    console.log("==== STRIPE WEBHOOK END ====");
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook] Handler failed:", err?.message);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
