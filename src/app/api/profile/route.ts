// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getUid(req: NextRequest): string | null {
  return req.cookies.get('uid')?.value ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const uid = getUid(req);
    if (!uid) return NextResponse.json({ error: 'No uid cookie' }, { status: 400 });

    // Create or fetch a user profile for this uid
    let user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          language: 'en',
        },
      });
      await prisma.auditLog.create({
        data: { userId: uid, action: 'profile_created', details: {} },
      });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = getUid(req);
    if (!uid) return NextResponse.json({ error: 'No uid cookie' }, { status: 400 });

    const body = await req.json();
    const { companyName, industry, language, complianceFocus } = body ?? {};

    const user = await prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        companyName: companyName ?? null,
        industry: industry ?? null,
        language: language ?? 'en',
        complianceFocus: complianceFocus ?? null,
      },
      update: {
        companyName: companyName ?? null,
        industry: industry ?? null,
        language: language ?? 'en',
        complianceFocus: complianceFocus ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: uid,
        action: 'profile_updated',
        details: { companyName, industry, language, complianceFocus },
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
