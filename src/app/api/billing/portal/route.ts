// src/app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET() {
  // Sanity ping
  return NextResponse.json({ ok: true, where: "/api/billing/portal", method: "GET" });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Find or create customer for this email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      customers.data[0] ??
      (await stripe.customers.create({
        email,
      }));

    const baseUrl = getBaseUrl(req);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/?portal=done`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    console.error("PORTAL ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Portal failed" },
      { status: 500 }
    );
  }
}


