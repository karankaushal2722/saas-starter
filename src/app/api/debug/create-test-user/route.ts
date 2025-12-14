// src/app/api/debug/create-test-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  // 🚫 Never allow this in production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const email = "test.user@example.com";

    // 1) Ensure a profile exists in public.profiles
    const user = await prisma.user.upsert({
      where: { email },
      update: {}, // nothing to update for now
      create: {
        email,
      },
    });

    // 2) Create a test document for this user
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        title: "First test document",
        content: "Seeded from /api/debug/create-test-user",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Test user and document created",
      user,
      doc,
    });
  } catch (err: any) {
    console.error("[create-test-user] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
