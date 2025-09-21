import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail, saveProfile } from "@/src/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") ?? "";
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

    const profile = await getProfileByEmail(email);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload?.email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    const saved = await saveProfile(payload);
    return NextResponse.json({ profile: saved }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/profile error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
