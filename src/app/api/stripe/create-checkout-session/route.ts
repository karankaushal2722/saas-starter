import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY not set");

const stripe = new Stripe(stripeSecretKey, {
  // If you hit TS issues with api versions, either remove this line,
  // or set it to the exact version your Stripe account is using.
  apiVersion: "2025-10-29.clover",
});

type Plan = "business" | "pro";
type Interval = "month" | "year";

function getPriceId(plan: Plan, interval: Interval) {
  const key =
    plan === "business" && interval === "month"
      ? "STRIPE_PRICE_BUSINESS_MONTHLY"
      : plan === "business" && interval === "year"
      ? "STRIPE_PRICE_BUSINESS_YEARLY"
      : plan === "pro" && interval === "month"
      ? "STRIPE_PRICE_PRO_MONTHLY"
      : "STRIPE_PRICE_PRO_YEARLY";

  const value = process.env[key];

  // Helpful error if env var exists but is wrong (true/false/etc)
  if (!value || !value.startsWith("price_")) {
    throw new Error(
      `Missing/invalid priceId. Env ${key} must be a Stripe Price ID (starts with "price_"). Got: ${value}`
    );
  }

  return value;
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (!origin) throw new Error("Missing origin and NEXT_PUBLIC_APP_URL");

    // Accept either JSON body or query params
    let planRaw: any = null;
    let intervalRaw: any = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      planRaw = body?.plan ?? body?.planId ?? body?.tier ?? null;
      intervalRaw = body?.interval ?? body?.billingInterval ?? null;
    } else {
      const { searchParams } = new URL(req.url);
      planRaw = searchParams.get("plan");
      intervalRaw = searchParams.get("interval");
    }

    const plan = (String(planRaw || "").toLowerCase() as Plan) || null;
    const interval = (String(intervalRaw || "").toLowerCase() as Interval) || null;

    if (plan !== "business" && plan !== "pro") {
      return NextResponse.json(
        { error: `Invalid plan. Expected "business" or "pro". Got: ${planRaw}` },
        { status: 400 }
      );
    }

    if (interval !== "month" && interval !== "year") {
      return NextResponse.json(
        { error: `Invalid interval. Expected "month" or "year". Got: ${intervalRaw}` },
        { status: 400 }
      );
    }

    const priceId = getPriceId(plan, interval);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      // optional but recommended if you have auth:
      // customer_email: "user@email.com",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("[create-checkout-session] error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 400 });
  }
}
