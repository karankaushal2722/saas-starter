// src/app/api/billing/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export type PlanId = "starter" | "business" | "business_pro";
export type BillingInterval = "month" | "year";

export type PlanInfo = {
  planId: PlanId;
  billingInterval: BillingInterval;
  status: "active" | "none";
};

export async function GET(_req: NextRequest) {
  // In recent Next versions cookies() is async in route handlers,
  // so we await it to avoid the PromiseReadonlyRequestCookies type error.
  const cookieStore = await cookies();

  const planId =
    (cookieStore.get("bg_plan")?.value as PlanId | undefined) ?? "starter";

  const billingInterval =
    (cookieStore.get("bg_interval")?.value as BillingInterval | undefined) ??
    "month";

  const status: "active" | "none" = planId === "starter" ? "none" : "active";

  const body: PlanInfo = {
    planId,
    billingInterval,
    status,
  };

  return NextResponse.json(body);
}
