// src/app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is not set in environment variables.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

type BillingInterval = "month" | "year";
type PlanId = "starter" | "business" | "business_pro";

// Map plan + interval to Stripe Price ID from env
function getPriceId(planId: PlanId, interval: BillingInterval): string | null {
  if (planId === "starter") {
    // Starter is free → no Stripe checkout
    return null;
  }

  if (planId === "business") {
    return interval === "month"
      ? process.env.STRIPE_PRICE_BUSINESS_MONTHLY || null
      : process.env.STRIPE_PRICE_BUSINESS_YEARLY || null;
  }

  if (planId === "business_pro") {
    return interval === "month"
      ? process.env.STRIPE_PRICE_BUSINESS_PRO_MONTHLY || null
      : process.env.STRIPE_PRICE_BUSINESS_PRO_YEARLY || null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const planId = body.planId as PlanId | undefined;
    const billingInterval = body.billingInterval as BillingInterval | undefined;

    if (!planId || !billingInterval) {
      return NextResponse.json(
        { error: "Missing planId or billingInterval." },
        { status: 400 }
      );
    }

    if (planId === "starter") {
      return NextResponse.json(
        {
          error:
            "Starter plan is free and does not require Stripe checkout. Just sign in.",
        },
        { status: 400 }
      );
    }

    const priceId = getPriceId(planId, billingInterval);

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe price ID is not configured for this plan/interval. Check your environment variables.",
        },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        planId,
        billingInterval,
        source: "bizguard_pricing_page",
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
