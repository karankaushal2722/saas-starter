// src/lib/plan.ts

export type PlanId = "free" | "business" | "business_pro";

type PlanInfo = {
  id: PlanId;
  label: string;
};

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    label: "Starter (Beta)",
  },
  business: {
    id: "business",
    label: "Business",
  },
  business_pro: {
    id: "business_pro",
    label: "Business Pro",
  },
};

/**
 * Given a Stripe price ID from the DB, figure out which internal plan this is.
 * Falls back to "free" if nothing matches.
 */
export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (!priceId) return "free";

  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return "free";
  if (priceId === process.env.STRIPE_PRICE_STARTER_YEARLY) return "free";

  if (priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY) return "business";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_YEARLY) return "business";

  if (priceId === process.env.STRIPE_PRICE_BUSINESS_PRO_MONTHLY)
    return "business_pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_PRO_YEARLY)
    return "business_pro";

  // Unknown / legacy price → treat them as paid but conservative: "business"
  return "business";
}
