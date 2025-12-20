// src/app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

// Use the same version your Stripe types expect
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

// ---------- Helpers ----------

function normalizeInterval(interval: string | null): "month" | "year" {
  if (!interval) return "month";
  const v = interval.toLowerCase();
  if (v === "year" || v === "yearly" || v === "annual") return "year";
  return "month";
}

function getPriceId(plan: string | null, interval: string | null): string | null {
  const billingInterval = normalizeInterval(interval);

  // Starter
  if (plan === "starter") {
    return billingInterval === "month"
      ? process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null
      : process.env.STRIPE_PRICE_STARTER_YEARLY ?? null;
  }

  // Business
  if (plan === "business") {
    return billingInterval === "month"
      ? process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? null
      : process.env.STRIPE_PRICE_BUSINESS_YEARLY ?? null;
  }

  // Business Pro – for now, reuse Business prices
  if (
    plan === "business_pro" ||  // what pricing page uses
    plan === "business-pro" ||  // alternate slug
    plan === "pro"
  ) {
    return billingInterval === "month"
      ? process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? null
      : process.env.STRIPE_PRICE_BUSINESS_YEARLY ?? null;
  }

  // Unknown plan
  return null;
}

function getOriginFromRequest(req: NextRequest): string {
  const url = new URL(req.url);

  // Prefer explicit base URL if set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  return `${url.protocol}//${url.host}`;
}

async function handleCreateCheckoutSession(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const plan = url.searchParams.get("plan");
    const interval = url.searchParams.get("interval");

    const priceId = getPriceId(plan, interval);

    if (!priceId) {
      console.error("[checkout] Missing or invalid priceId", { plan, interval });
      return NextResponse.json(
        { error: "Invalid plan/interval – missing Stripe price ID" },
        { status: 400 }
      );
    }

    const origin = getOriginFromRequest(req);

    if (demoMode) {
      console.log("[checkout] DEMO_MODE=true, still creating real Stripe session for now", {
        plan,
        interval,
        priceId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      console.error("[checkout] Stripe session created without URL", session);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    // Redirect user to Stripe Checkout
    return NextResponse.redirect(session.url, 303);
  } catch (err: any) {
    console.error("[checkout] Error creating checkout session", err);
    return NextResponse.json(
      { error: err?.message ?? "Error creating checkout session" },
      { status: 500 }
    );
  }
}

// Support both GET (what your pricing page uses) and POST (if you ever call it via fetch)
export async function GET(req: NextRequest) {
  return handleCreateCheckoutSession(req);
}

export async function POST(req: NextRequest) {
  return handleCreateCheckoutSession(req);
}
