// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/profile?email=...
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing ?email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  return NextResponse.json({
    ok: true,
    profile: user ?? null,
  });
}

// PUT /api/profile
// body: { email, companyName?, industry?, language?, complianceFocus? }
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.email) {
    return NextResponse.json({ error: "Missing email in body" }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();

  const updated = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      companyName: body.companyName ?? "",
      industry: body.industry ?? "",
      language: body.language ?? "en",
      complianceFocus: body.complianceFocus ?? "",
    },
    update: {
      companyName: body.companyName ?? undefined,
      industry: body.industry ?? undefined,
      language: body.language ?? undefined,
      complianceFocus: body.complianceFocus ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
