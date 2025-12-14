import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------
// ENV + STRIPE CLIENT
// ---------------------------------------------------------
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

// Only require webhook secret when NOT in demo mode
if (!demoMode && !webhookSecret) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET not set (required when DEMO_MODE=false)"
  );
}

// Use the same API version you have configured in Stripe
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

// ---------------------------------------------------------
// Helper: upsert Supabase user from Checkout Session
// ---------------------------------------------------------
async function upsertUserFromCheckoutSession(session: any) {
  // Try to get an email from various places Stripe can put it
  const email: string | null =
    session?.customer_details?.email ||
    session?.metadata?.email ||
    session?.customer_email ||
    null;

  if (!email) {
    console.log(
      "[Stripe webhook] checkout.session.completed: no email found, skipping DB sync"
    );
    return;
  }

  // Customer can be an ID or expanded object
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  // Subscription can be an ID or expanded object or null
  const subscriptionRaw = session.subscription ?? null;
  const subscriptionId =
    typeof subscriptionRaw === "string"
      ? subscriptionRaw
      : subscriptionRaw?.id ?? null;

  let priceId: string | null = null;
  let currentPeriodEnd: Date | null = null;

  // Best-effort fetch of the subscription so we can grab price + period end
  try {
    if (session.mode === "subscription" && subscriptionId) {
      const subscription: any = await stripe.subscriptions.retrieve(
        subscriptionId
      );

      priceId = subscription?.items?.data?.[0]?.price?.id ?? null;

      if (subscription?.current_period_end) {
        currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      }
    }
  } catch (err) {
    console.error(
      "[Stripe webhook] error fetching subscription details:",
      err
    );
  }

  // Upsert into your Prisma User model (public.profiles)
  await prisma.user.upsert({
    where: { email },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
    },
    create: {
      email,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
    },
  });

  console.log(
    `[Stripe webhook] upserted user: email=${email}, customer=${customerId}, subscription=${subscriptionId}, price=${priceId}`
  );
}

// ---------------------------------------------------------
// POST handler
// ---------------------------------------------------------
export async function POST(req: NextRequest) {
  console.log("==== STRIPE WEBHOOK START ====");
  console.log("[Stripe webhook] DEMO_MODE =", demoMode);

  let event: Stripe.Event;

  if (demoMode) {
    // DEMO MODE: do not verify signature (Stripe CLI / dashboard tools
    // sometimes don't preserve the raw body as needed by constructEvent)
    try {
      const json = await req.json();
      event = json as Stripe.Event;
      console.log(
        "[Stripe webhook] DEMO_MODE: accepted event without signature verification"
      );
    } catch (err: any) {
      console.error("[Stripe webhook] DEMO_MODE: invalid JSON:", err?.message);
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  } else {
    // REAL MODE: verify Stripe signature
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new NextResponse("Missing stripe-signature header", {
        status: 400,
      });
    }

    const rawBody = await req.text();

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret!);
    } catch (err: any) {
      console.error("Webhook verification error:", err?.message);
      return new NextResponse(`Webhook error: ${err?.message}`, {
        status: 400,
      });
    }
  }

  console.log("[Stripe webhook] Event type:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await upsertUserFromCheckoutSession(session);
        break;
      }

      default: {
        // We just ignore everything else for now, but still 200 so Stripe
        // doesn't keep retrying.
        console.log(
          "[Stripe webhook] Unhandled event type (ignored for DB sync):",
          event.type
        );
      }
    }
  } catch (err) {
    // Never throw out of the handler; just log and still ACK so Stripe doesn’t
    // retry forever.
    console.error("[Stripe webhook] Handler error:", err);
  }

  console.log("==== STRIPE WEBHOOK END ====");
  return NextResponse.json({ received: true });
}
