import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
});

function resolveAppUrl(req: NextRequest): string {
  const h = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${h}`;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/billing/portal" });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Find or auto-create a customer by email for portal access
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] ?? await stripe.customers.create({ email });
    const appUrl = resolveAppUrl(req);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: appUrl
    });

    return NextResponse.json({ url: portal.url }, { status: 200 });
  } catch (err: any) {
    console.error("portal error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
