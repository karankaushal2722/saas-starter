import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, interval } = body;

    console.log("[checkout] incoming", {
      plan,
      interval,
      env: {
        STRIPE_PRICE_BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
        STRIPE_PRICE_BUSINESS_YEARLY: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
        STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
        STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
      },
    });

    if (!plan || !interval) {
      return NextResponse.json(
        { error: "Invalid plan/interval" },
        { status: 400 }
      );
    }

    let priceId: string | undefined;

    if (plan === "business" && interval === "month") {
      priceId = process.env.STRIPE_PRICE_BUSINESS_MONTHLY;
    }
    if (plan === "business" && interval === "year") {
      priceId = process.env.STRIPE_PRICE_BUSINESS_YEARLY;
    }
    if (plan === "pro" && interval === "month") {
      priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
    }
    if (plan === "pro" && interval === "year") {
      priceId = process.env.STRIPE_PRICE_PRO_YEARLY;
    }

    if (!priceId || !priceId.startsWith("price_")) {
      console.error("[checkout] Missing or invalid priceId", { priceId });
      return NextResponse.json(
        { error: "Missing priceId" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[checkout] fatal error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
