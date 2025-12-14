// src/app/pricing/page.tsx

import Link from "next/link";

type PricingPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

const PLANS = [
  {
    id: "starter",
    name: "Starter (Beta)",
    price: "$0",
    interval: "",
    description: "Perfect to try BizGuard for simple questions and documents.",
    features: [
      "Ask basic legal questions",
      "A few document reviews per month",
      "Multilingual answers",
      "Best for testing and solo owners",
    ],
    buttonLabel: "Start free",
    // Free plan – just send to dashboard
    href: "/dashboard",
  },
  {
    id: "business",
    name: "Business",
    price: "$29",
    interval: "/month",
    description: "For active small businesses with regular documents.",
    features: [
      "More document reviews per month",
      "Priority AI analysis",
      "Best for 1–3 locations",
      "Email support",
    ],
    buttonLabel: "Choose this plan",
    // Paid plan – Stripe checkout route
    href: "/api/stripe/create-checkout-session?plan=business&interval=month",
  },
  {
    id: "business_pro",
    name: "Business Pro",
    price: "$49",
    interval: "/month",
    description: "For growing businesses that live in their paperwork.",
    features: [
      "Advanced document review",
      "Priority AI responses",
      "Higher limits for uploads & analysis",
      "Faster support for critical issues",
    ],
    buttonLabel: "Choose this plan",
    href: "/api/stripe/create-checkout-session?plan=business_pro&interval=month",
  },
];

export default function PricingPage({ searchParams }: PricingPageProps) {
  const success = searchParams?.success === "1";
  const errorMsg = searchParams?.error;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f172a 0%, #020617 45%, #000 100%)",
        color: "#e5e7eb",
        padding: "40px 16px",
      }}
    >
      <main style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Back link */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/"
            style={{
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to home
          </Link>
        </div>

        {/* Heading */}
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 32,
              marginBottom: 8,
              fontWeight: 600,
              color: "#f9fafb",
            }}
          >
            Choose the BizGuard plan that fits your business
          </h1>
          <p
            style={{
              maxWidth: 700,
              color: "#9ca3af",
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            All plans include multilingual AI assistance, document explanations,
            and risk summaries. Upgrade only when it&apos;s saving you real time
            and money.
          </p>

          {/* Little billing toggle (visual only for now) */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: 999,
              backgroundColor: "rgba(15,23,42,0.8)",
              border: "1px solid #1f2937",
              padding: 4,
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <span
              style={{
                borderRadius: 999,
                padding: "4px 12px",
                backgroundColor: "#111827",
                color: "#f9fafb",
              }}
            >
              Monthly billing
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: "4px 12px",
                color: "#6b7280",
              }}
            >
              Yearly (coming soon)
            </span>
          </div>
        </header>

        {/* Optional status messages from checkout redirect */}
        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #16a34a",
              background: "rgba(6,95,70,0.5)",
              color: "#bbf7d0",
              fontSize: 14,
            }}
          >
            Subscription activated. You can manage your documents on the
            dashboard.
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #b91c1c",
              background: "rgba(127,29,29,0.7)",
              color: "#fecaca",
              fontSize: 14,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Plans grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            marginTop: 16,
          }}
        >
          {PLANS.map((plan) => {
            const isPro = plan.id === "business_pro";

            return (
              <div
                key={plan.id}
                style={{
                  position: "relative",
                  borderRadius: 16,
                  padding: 24,
                  border: isPro ? "2px solid #22c55e" : "1px solid #1f2937",
                  boxShadow: isPro
                    ? "0 0 35px rgba(34,197,94,0.4)"
                    : "0 18px 40px rgba(0,0,0,0.5)",
                  background: isPro
                    ? "radial-gradient(circle at top, #022c22, #020617)"
                    : "rgba(15,23,42,0.95)",
                }}
              >
                {isPro && (
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 18,
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 999,
                      backgroundColor: "rgba(16,185,129,0.18)",
                      color: "#6ee7b7",
                      fontWeight: 600,
                    }}
                  >
                    Most popular
                  </span>
                )}

                <h2
                  style={{
                    fontSize: 20,
                    marginBottom: 8,
                    fontWeight: 600,
                    color: "#f9fafb",
                  }}
                >
                  {plan.name}
                </h2>
                <p style={{ marginBottom: 16, color: "#9ca3af", fontSize: 14 }}>
                  {plan.description}
                </p>

                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    marginBottom: 16,
                    color: "#f9fafb",
                  }}
                >
                  {plan.price}
                  {plan.interval && (
                    <span
                      style={{
                        fontSize: 16,
                        color: "#9ca3af",
                        marginLeft: 4,
                        fontWeight: 500,
                      }}
                    >
                      {plan.interval}
                    </span>
                  )}
                </div>

                <ul
                  style={{
                    marginBottom: 18,
                    paddingLeft: 18,
                    color: "#e5e7eb",
                    fontSize: 14,
                  }}
                >
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 6 }}>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  style={{
                    display: "inline-block",
                    textAlign: "center",
                    padding: "10px 18px",
                    borderRadius: 999,
                    backgroundColor: isPro
                      ? "#22c55e"
                      : plan.id === "starter"
                      ? "#1f2937"
                      : "#1d4ed8",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 600,
                    marginTop: 8,
                    fontSize: 14,
                  }}
                >
                  {plan.buttonLabel}
                </a>
              </div>
            );
          })}
        </section>

        <p
          style={{
            marginTop: 24,
            color: "#6b7280",
            fontSize: 12,
            maxWidth: 700,
          }}
        >
          You can cancel your subscription any time. BizGuard helps you
          understand documents and risks but does not replace a licensed
          attorney.
        </p>
      </main>
    </div>
  );
}
