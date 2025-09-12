// src/app/api/billing/portal/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // ensure Node runtime for Stripe SDK

// Sanity GET (so you can load it in a browser and see ok:true)
export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/billing/portal", method: "GET" });
}

// Real portal creation
export async function POST(req: Request) {
  try {
    const { customerId, returnUrl } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY missing" }, { status: 500 });
    }
    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    // Use the same version you used on the webhook, or omit apiVersion entirely.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY /* , { apiVersion: "2025-08-27.basil" } */);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        returnUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://saas-starter-beta-two.vercel.app",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create portal session" }, { status: 500 });
  }
}

