// src/app/pricing/page.tsx
"use client";

import { useState } from "react";

type BillingInterval = "month" | "year";

type PlanId = "starter" | "business" | "business_pro";

type Plan = {
  id: PlanId;
  label: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlight?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    label: "Starter (beta)",
    description: "Perfect to try BizGuard for simple questions and documents.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Ask basic legal questions",
      "A few document reviews per month",
      "Multilingual answers",
      "Best for testing and solo owners",
    ],
  },
  {
    id: "business",
    label: "Business",
    description: "For active small businesses with regular documents.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "More document reviews per month",
      "Priority AI analysis",
      "Best for 1–3 locations",
      "Email support",
    ],
  },
  {
    id: "business_pro",
    label: "Business Pro",
    description: "For growing businesses that live in their paperwork.",
    monthlyPrice: 49,
    yearlyPrice: 490,
    highlight: true,
    features: [
      "Advanced document review",
      "Priority AI responses",
      "Higher limits for uploads & analysis",
      "Faster support for critical issues",
    ],
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChoosePlan(planId: PlanId) {
    try {
      setError(null);
      setLoadingPlan(planId);

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingInterval,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoadingPlan(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#020617",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 16px 40px",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <a
            href="/"
            style={{
              fontSize: 13,
              color: "rgba(148,163,184,0.9)",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </a>
          <h1
            style={{
              marginTop: 8,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            Choose the BizGuard plan that fits your business
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "rgba(203,213,225,0.9)",
            }}
          >
            All plans include multilingual AI assistance, document explanations,
            and risk summaries. Upgrade only when it&apos;s saving you real time
            and money.
          </p>
        </header>

        {/* Billing interval toggle */}
        <div
          style={{
            marginBottom: 24,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: 4,
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.8)",
            background: "rgba(15,23,42,0.9)",
          }}
        >
          <ToggleButton
            active={billingInterval === "month"}
            onClick={() => setBillingInterval("month")}
          >
            Monthly billing
          </ToggleButton>
          <ToggleButton
            active={billingInterval === "year"}
            onClick={() => setBillingInterval("year")}
          >
            Yearly (save ~2 months)
          </ToggleButton>
        </div>

        {error && (
          <p style={{ color: "#fca5a5", marginBottom: 16, fontSize: 13 }}>
            {error}
          </p>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {PLANS.map((plan) => {
            const price =
              billingInterval === "month"
                ? plan.monthlyPrice
                : plan.yearlyPrice;
            const suffix =
              billingInterval === "month" ? "/month" : "/year";

            const isFree = price === 0;

            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: 18,
                  border: plan.highlight
                    ? "1px solid rgba(34,197,94,0.9)"
                    : "1px solid rgba(30,64,175,0.8)",
                  padding: 20,
                  background: plan.highlight
                    ? "radial-gradient(circle at top, rgba(34,197,94,0.20), rgba(15,23,42,0.98))"
                    : "rgba(15,23,42,0.96)",
                  boxShadow: plan.highlight
                    ? "0 18px 60px rgba(34,197,94,0.25)"
                    : "0 12px 40px rgba(15,23,42,0.8)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "rgba(148,163,184,0.9)",
                    marginBottom: 6,
                  }}
                >
                  {plan.label}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(203,213,225,0.95)",
                    marginBottom: 12,
                  }}
                >
                  {plan.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                    }}
                  >
                    {isFree ? "$0" : `$${price}`}
                  </span>
                  {!isFree && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(148,163,184,0.9)",
                      }}
                    >
                      {suffix}
                    </span>
                  )}
                </div>

                {!isFree && billingInterval === "year" && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(74,222,128,0.9)",
                      marginBottom: 10,
                    }}
                  >
                    ~2 months free compared to monthly.
                  </p>
                )}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginTop: 8,
                    marginBottom: 12,
                    fontSize: 13,
                    color: "rgba(203,213,225,0.9)",
                  }}
                >
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 6 }}>
                      • {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => (isFree ? (window.location.href = "/auth") : handleChoosePlan(plan.id))}
                  disabled={loadingPlan === plan.id}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: isFree
                      ? "rgba(148,163,184,0.25)"
                      : plan.highlight
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "rgba(30,64,175,0.9)",
                    color: isFree ? "white" : "black",
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                  }}
                >
                  {isFree
                    ? "Start free"
                    : loadingPlan === plan.id
                    ? "Redirecting to checkout…"
                    : "Choose this plan"}
                </button>
              </div>
            );
          })}
        </section>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "rgba(148,163,184,0.9)",
          }}
        >
          You can cancel your subscription any time. BizGuard helps you
          understand documents and risks but does not replace a licensed
          attorney.
        </p>
      </div>
    </main>
  );
}

type ToggleButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

function ToggleButton({ active, children, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: "none",
        fontSize: 12,
        cursor: "pointer",
        background: active ? "white" : "transparent",
        color: active ? "#020617" : "rgba(148,163,184,0.9)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
