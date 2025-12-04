import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // needed for Prisma

type SaveProfileInput = {
  businessName: string;
  industry: string;
  primaryLanguage: string;
  otherLanguages?: string;
  country?: string;
};

function getEmailFromCookies() {
  const cookieStore = cookies();
  const email = cookieStore.get("uid")?.value; // we set this at auth time
  return email ?? null;
}

export async function GET(_req: NextRequest) {
  const email = getEmailFromCookies();

  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
  });

  return NextResponse.json({ profile }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const email = getEmailFromCookies();

  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as SaveProfileInput;

  const profile = await prisma.profile.upsert({
    where: { email },
    update: {
      businessName: body.businessName || null,
      industry: body.industry || null,
      primaryLanguage: body.primaryLanguage || null,
      otherLanguages: body.otherLanguages || null,
      country: body.country || null,
    },
    create: {
      email,
      businessName: body.businessName || null,
      industry: body.industry || null,
      primaryLanguage: body.primaryLanguage || null,
      otherLanguages: body.otherLanguages || null,
      country: body.country || null,
    },
  });

  return NextResponse.json({ profile }, { status: 200 });
}
