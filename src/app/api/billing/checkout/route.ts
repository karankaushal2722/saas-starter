import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/billing/checkout", method: "GET" });
}

export async function POST() {
  return NextResponse.json({ ok: true, where: "/api/billing/checkout", method: "POST" });
}
