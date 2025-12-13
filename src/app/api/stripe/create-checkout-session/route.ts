import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

const stripe = new Stripe(stripeSecretKey, {
  // If TS ever complains about apiVersion typing, delete this line entirely.
  apiVersion: "2025-10-29.clover",
});

type Plan = "starter" | "business" | "pro";
type Interval = "month" | "year";

/**
 * Returns the first defined env var value from a list of possible keys.
 * This protects you if your UI/code expects STRIPE_PRICE_* but you set BIZGUARD_* (or vice-versa).
 */
function pickEnv(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function normalizeInterval(input: string): Interval | null {
  const v = (input || "").toLowerCase().trim();
  if (v === "month" || v === "monthly") return "month";
  if (v === "year" || v === "yearly" || v === "annual" || v === "annually") return "year";
  return null;
}

function normalizePlan(input: string): Plan | null {
  const v = (input || "").toLowerCase().trim();
  if (v === "starter" || v === "free") return "starter";
  if (v === "business") return "business";
  if (v === "pro" || v === "business_pro" || v === "business-pro") return "pro";
  return null;
}

function getOrigin(req: NextRequest) {
  // Works on Vercel + local
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

function resolvePriceId(plan: Plan, interval: Interval) {
  // ✅ Your recommended canonical env var names
  const BUSINESS_MONTH = pickEnv(
    "STRIPE_PRICE_BUSINESS_MONTHLY",
    "BIZGUARD_PRICE_BUSINESS_MONTHLY",
    "PRICE_BUSINESS_MONTHLY",
    "BUSINESS_MONTHLY_PRICE_ID"
  );
  const BUSINESS_YEAR = pickEnv(
    "STRIPE_PRICE_BUSINESS_YEARLY",
    "BIZGUARD_PRICE_BUSINESS_YEARLY",
    "PRICE_BUSINESS_YEARLY",
    "BUSINESS_YEARLY_PRICE_ID"
  );

  const PRO_MONTH = pickEnv(
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_BUSINESS_PRO_MONTHLY",
    "BIZGUARD_PRICE_PRO_MONTHLY",
    "PRICE_PRO_MONTHLY",
    "PRO_MONTHLY_PRICE_ID"
  );
  const PRO_YEAR = pickEnv(
    "STRIPE_PRICE_PRO_YEARLY",
    "STRIPE_PRICE_BUSINESS_PRO_YEARLY",
    "BIZGUARD_PRICE_PRO_YEARLY",
    "PRICE_PRO_YEARLY",
    "PRO_YEARLY_PRICE_ID"
  );

  if (plan === "business") return interval === "month" ? BUSINESS_MONTH : BUSINESS_YEAR;
  if (plan === "pro") return interval === "month" ? PRO_MONTH : PRO_YEAR;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    // Expecting body like: { plan: "business", interval: "month" }
    const body = await req.json().catch(() => ({} as any));

    const planRaw = body?.plan ?? body?.tier ?? body?.product;
    const intervalRaw = body?.interval ?? body?.billingInterval ?? body?.billing_cycle;

    const plan = normalizePlan(String(planRaw ?? ""));
    const interval = normalizeInterval(String(intervalRaw ?? ""));

    const origin = getOrigin(req);

    // Helpful log block (this is what you look at in Vercel logs)
    console.log("[checkout] incoming", {
      origin,
      planRaw,
      intervalRaw,
      plan,
      interval,
      // show if env vars exist (not their values)
      env: {
        DEMO_MODE: process.env.DEMO_MODE,
        STRIPE_PRICE_BUSINESS_MONTHLY: !!process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
        STRIPE_PRICE_BUSINESS_YEARLY: !!process.env.STRIPE_PRICE_BUSINESS_YEARLY,
        STRIPE_PRICE_PRO_MONTHLY: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
        STRIPE_PRICE_PRO_YEARLY: !!process.env.STRIPE_PRICE_PRO_YEARLY,
      },
    });

    if (!plan || !interval) {
      return NextResponse.json(
        { error: "Invalid plan/interval", received: { planRaw, intervalRaw } },
        { status: 400 }
      );
    }

    if (plan === "starter") {
      return NextResponse.json(
        { error: "Starter is free and does not use Stripe Checkout." },
        { status: 400 }
      );
    }

    const priceId = resolvePriceId(plan, interval);

    console.log("[checkout] resolved", { plan, interval, priceId });

    if (!priceId) {
      return NextResponse.json(
        {
          error: "Missing priceId (env var not found for plan/interval)",
          expectedFor: { plan, interval },
          hint:
            "Check Vercel env vars are set for the SAME environment you’re testing (Production vs Preview).",
        },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: {
        plan,
        interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[checkout] fatal", err?.message || err);
    return NextResponse.json(
      { error: "Checkout session failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
