// src/lib/subscription.ts
import prisma from "@/lib/prisma";

export type PlanId = "free" | "business" | "business_pro";

function matchPlanFromPriceId(priceId: string | null): PlanId {
  if (!priceId) return "free";

  const businessMonthly = process.env.STRIPE_PRICE_BUSINESS_MONTHLY;
  const businessYearly = process.env.STRIPE_PRICE_BUSINESS_YEARLY;
  const businessProMonthly = process.env.STRIPE_PRICE_BUSINESS_PRO_MONTHLY;
  const businessProYearly = process.env.STRIPE_PRICE_BUSINESS_PRO_YEARLY;

  if (priceId === businessProMonthly || priceId === businessProYearly) {
    return "business_pro";
  }

  if (priceId === businessMonthly || priceId === businessYearly) {
    return "business";
  }

  return "free";
}

export async function getUserPlan(email: string): Promise<PlanId> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { stripePriceId: true },
  });

  return matchPlanFromPriceId(user?.stripePriceId ?? null);
}
