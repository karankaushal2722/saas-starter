// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Debug GET so we can verify the route exists from a browser
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/stripe/webhook" });
}

// Minimal POST so Stripe will get 200 OK
export async function POST(req: NextRequest) {
  return NextResponse.json({ received: true });
}
