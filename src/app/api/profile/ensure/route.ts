// src/app/api/profile/ensure/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * This route is intentionally simple:
 * - It does NOT use Supabase auth helpers or cookies.
 * - If an `email` is provided in the JSON body, it upserts a User row.
 * - If not, it just returns { ok: true }.
 *
 * This avoids the "this.context.cookies(...).get is not a function" error
 * you’re seeing in Vercel logs.
 */
export async function POST(req: NextRequest) {
  try {
    let email: string | null = null;

    try {
      const body = await req.json();
      if (body && typeof body.email === "string") {
        email = body.email;
      }
    } catch {
      // no body / invalid JSON – that's fine, we just skip upsert
    }

    let profile = null;

    if (email) {
      profile = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    }

    return NextResponse.json(
      { ok: true, profile },
      { status: 200 }
    );
  } catch (err) {
    console.error("[api/profile/ensure] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
