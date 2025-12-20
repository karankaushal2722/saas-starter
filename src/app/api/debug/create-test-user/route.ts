// src/app/api/debug/create-test-user/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  // Hard block in production (or anywhere DEMO_MODE is not true)
  if (!DEMO_MODE) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const email = "test.user@example.com";

    // Upsert a test user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Create a sample document for that user
    const doc = await prisma.document.create({
      data: {
        title: "First test document",
        content: "Seeded from /api/debug/create-test-user",
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Test user and document created",
      user,
      doc,
    });
  } catch (err: any) {
    console.error("[api/debug/create-test-user] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
