import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // see lib/prisma.ts below
import { cookies } from "next/headers";

export const runtime = "nodejs";

// GET /api/profile?email=someone@example.com
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const qpEmail = url.searchParams.get("email") ?? undefined;

    // Try cookie first, fall back to query param
    const cookieStore = cookies();
    const cookieEmail = cookieStore.get("uid")?.value;
    const email = cookieEmail || qpEmail;

    if (!email) {
      return NextResponse.json({ error: "No uid cookie or email query param" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Set a cookie so next calls don't need ?email
    if (!cookieEmail) {
      cookieStore.set("uid", email, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
