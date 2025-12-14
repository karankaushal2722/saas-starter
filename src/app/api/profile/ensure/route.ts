// src/app/api/profile/ensure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { ensureUserProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = cookies();

    // Supabase auth client for route handlers (App Router)
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[ensure profile] supabase auth error:", error.message);
    }

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // This is the important part:
    // Make sure we have a row in public.profiles (Prisma User model)
    const profile = await ensureUserProfile(user.email);

    return NextResponse.json(
      { ok: true, email: user.email, profileId: profile?.id ?? null },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ensure profile] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
