// src/app/api/profile/ensure/route.ts

import { NextResponse } from "next/server";
import { getProfileByEmail, saveProfileInput } from "@/lib/db";

/**
 * TODO: Wire this up to your real auth.
 *
 * For now this is a stub so the build works without pulling in `next-auth`.
 * When we hook up your auth, implement this to return the logged-in user's email.
 */
async function getCurrentUserEmail(): Promise<string | null> {
  // Example for later (DO NOT UNCOMMENT until we know your auth setup):
  // const session = await getServerSession(authOptions);
  // return session?.user?.email ?? null;

  return null; // stub
}

export async function POST() {
  try {
    const email = await getCurrentUserEmail();

    if (!email) {
      // No logged in user – just return 401 so we don't blow up in logs.
      return NextResponse.json(
        { ok: false, error: "No logged-in user found" },
        { status: 401 }
      );
    }

    // See if the profile already exists
    const existing = await getProfileByEmail(email);

    if (!existing) {
      // Create a minimal profile row
      await saveProfileInput({ email });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/profile/ensure] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
