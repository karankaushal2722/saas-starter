// src/app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // keep in sync with your checkout route
});

// Small GET so /api/billing/portal is visible if you navigate there
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/billing/portal" });
}

// Build the app URL (works on Vercel and locally)
function resolveAppUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL; // e.g. https://saas-starter-beta-two.vercel.app
  if (envUrl) return envUrl;
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * POST /api/billing/portal
 * Accepts either:
 * - JSON: { "email": "tester@example.com" }
 * - Form POST: email=tester@example.com
 * Returns: { url: "https://billing.stripe.com/..." }
 */
export async function POST(req: NextRequest) {
  try {
    // Accept both JSON and form posts
    let email: string | null = null;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await req.json();
      email = typeof body?.email === "string" ? body.email : null;
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const val = form.get("email");
      email = typeof val === "string" ? val : null;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Missing or invalid `email` in request body." },
        { status: 400 }
      );
    }

    // Find customer by email (created during Checkout)
    const search = await stripe.customers.search({
      query: `email:'${email.replace(/'/g, "\\'")}'`,
      limit: 1,
    });

    const customer = search.data?.[0];
    if (!customer) {
      return NextResponse.json(
        { error: `No Stripe customer found for ${email}.` },
        { status: 404 }
      );
    }

    const appUrl = resolveAppUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Billing portal error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
