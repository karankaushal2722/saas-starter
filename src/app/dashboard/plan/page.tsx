// src/app/dashboard/plan/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type PlanId = "starter" | "business" | "business_pro";
type BillingInterval = "month" | "year";

async function loadPlan() {
  // ✅ Next 16+: cookies() is async
  const cookieStore = await cookies();

  // These cookie names can be whatever you decided earlier
  const planId = (cookieStore.get("bg_plan")?.value as PlanId | undefined) ?? "starter";
  const billingInterval =
    (cookieStore.get("bg_interval")?.value as BillingInterval | undefined) ?? "month";

  return { planId, billingInterval };
}

export default async function PlanPage() {
  let plan: { planId: PlanId; billingInterval: BillingInterval } | null = null;
  let error: string | null = null;

  try {
    plan = await loadPlan();
  } catch (e: any) {
    error = e?.message ?? "Failed to load plan.";
  }

  return (
    <main style={{ padding: 24 }}>
      <Link href="/dashboard">← Back to dashboard</Link>
      <h1 style={{ marginTop: 16 }}>Your BizGuard plan</h1>
      <p>Review your current subscription, manage billing, or change your plan.</p>

      {error && (
        <div style={{ border: "1px solid #f00", padding: 12, marginTop: 16 }}>
          <b>We couldn't load your plan.</b>
          <div style={{ marginTop: 8 }}>{error}</div>
        </div>
      )}

      {!error && plan && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: 16,
            marginTop: 16,
            borderRadius: 8,
          }}
        >
          <div><b>Current plan</b></div>
          <div style={{ marginTop: 8 }}>
            {plan.planId === "starter" ? "Starter (Free)" : plan.planId}
          </div>
          <div style={{ marginTop: 8 }}>
            Billed {plan.billingInterval === "month" ? "monthly" : "yearly"}
          </div>

          {plan.planId === "starter" && (
            <div style={{ marginTop: 12 }}>
              You’re on the free Starter plan. Upgrade from the{" "}
              <Link href="/pricing">pricing page</Link>.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
