// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";        // run in Node, not Edge
export const dynamic = "force-dynamic"; // no caching

export async function GET(_req: NextRequest) {
  try {
    // In your Next version, cookies() returns a Promise-like object,
    // so we MUST await it.
    const cookieStore = await cookies();
    const uid = cookieStore.get("uid")?.value ?? null;

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated (uid cookie missing)." },
        { status: 401 }
      );
    }

    // For now we just return the uid.
    return NextResponse.json({ ok: true, uid });
  } catch (err: any) {
    console.error("[profile GET] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error in /api/profile" },
      { status: 500 }
    );
  }
}
