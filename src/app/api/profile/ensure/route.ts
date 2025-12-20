// src/app/api/profile/ensure/route.ts

import { NextResponse } from "next/server";
import { getProfileWithPlanByEmail, saveProfileInput } from "@/lib/db";
// import whatever you use to get the current session/user:
import { getServerSession } from "next-auth"; // <-- if you're using next-auth
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // <-- adjust path if needed

export async function POST() {
  try {
    // 1) Get logged-in user (keep this part consistent with your existing code)
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2) Make sure a row exists (same idea as your current code)
    const profile = await saveProfileInput({ email });

    // 3) Fetch profile + derived plan
    const profileWithPlan = await getProfileWithPlanByEmail(email);

    return NextResponse.json({
      ok: true,
      profile: {
        id: profileWithPlan?.id ?? profile.id,
        email: profileWithPlan?.email ?? profile.email,
        planId: profileWithPlan?.planId ?? "free",
        stripeCustomerId: profileWithPlan?.stripeCustomerId ?? null,
        stripeSubscriptionId: profileWithPlan?.stripeSubscriptionId ?? null,
        stripePriceId: profileWithPlan?.stripePriceId ?? null,
        stripeCurrentPeriodEnd: profileWithPlan?.stripeCurrentPeriodEnd ?? null,
      },
    });
  } catch (err: any) {
    console.error("[/api/profile/ensure] error", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
