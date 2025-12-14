// src/app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const demoMode = process.env.DEMO_MODE === "true";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

// Helper: pick correct price id from env based on plan + interval
function getPriceId(plan: string, interval: string): string | null {
  const key = `${plan}_${interval}`.toLowerCase();

  switch (key) {
    case "starter_month":
      return process.env.STRIPE_PRICE_STARTER_MONTHLY || null;
    case "starter_year":
      return process.env.STRIPE_PRICE_STARTER_YEARLY || null;
    case "business_month":
      return process.env.STRIPE_PRICE_BUSINESS_MONTHLY || null;
    case "business_year":
      return process.env.STRIPE_PRICE_BUSINESS_YEARLY || null;
    // add more plans here if you introduce them
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get logged-in Supabase user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: supaError,
    } = await supabase.auth.getUser();

    if (supaError || !user) {
      console.error("[checkout] No Supabase user", supaError);
      return NextResponse.json(
        { error: "You must be signed in to start a subscription." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const planRaw = url.searchParams.get("plan") || "business";
    const intervalRaw = url.searchParams.get("interval") || "month";

    const plan = planRaw.toLowerCase();
    const interval = intervalRaw.toLowerCase();

    const priceId = getPriceId(plan, interval);

    if (!priceId) {
      console.error("[checkout] Invalid plan/interval", { plan, interval });
      return NextResponse.json(
        { error: "Invalid plan or billing interval." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Useful debug log (shows up in Vercel logs)
    console.log("[checkout] incoming", {
      origin: req.headers.get("origin"),
      planRaw,
      intervalRaw,
      plan,
      interval,
      priceId,
      env: {
        DEMO_MODE: demoMode,
        STRIPE_PRICE_STARTER_MONTHLY: !!process.env.STRIPE_PRICE_STARTER_MONTHLY,
        STRIPE_PRICE_STARTER_YEARLY: !!process.env.STRIPE_PRICE_STARTER_YEARLY,
        STRIPE_PRICE_BUSINESS_MONTHLY:
          !!process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
        STRIPE_PRICE_BUSINESS_YEARLY:
          !!process.env.STRIPE_PRICE_BUSINESS_YEARLY,
      },
    });

    if (demoMode) {
      // In demo mode we don't actually hit Stripe – just fake a redirect
      return NextResponse.json({
        demo: true,
        redirectUrl: `${baseUrl}/dashboard?checkout=demo`,
      });
    }

    const email = user.email || undefined;
    const supabaseUserId = user.id;

    // Create real Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
      customer_email: email,
      client_reference_id: supabaseUserId,
      metadata: {
        supabaseUserId,
        email: email ?? "",
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          supabaseUserId,
          email: email ?? "",
          plan,
          interval,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[checkout] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
