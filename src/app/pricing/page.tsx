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
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/">← Back to home</Link>
      </div>

      <h1 style={{ fontSize: 32, marginBottom: 12 }}>
        Choose the BizGuard plan that fits your business
      </h1>
      <p style={{ maxWidth: 700, color: "#ccc", marginBottom: 24 }}>
        All plans include multilingual AI assistance, document explanations, and
        risk summaries. Upgrade only when it&apos;s saving you real time and money.
      </p>

      {/* Optional status messages from checkout redirect */}
      {success && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 4,
            border: "1px solid #16a34a",
            background: "#022c22",
            color: "#bbf7d0",
          }}
        >
          Subscription activated. You can manage your documents on the dashboard.
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 4,
            border: "1px solid #b91c1c",
            background: "#450a0a",
            color: "#fecaca",
          }}
        >
          {errorMsg}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          marginTop: 16,
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              borderRadius: 12,
              padding: 24,
              border: plan.id === "business_pro" ? "2px solid #22c55e" : "1px solid #333",
              boxShadow:
                plan.id === "business_pro"
                  ? "0 0 30px rgba(34,197,94,0.3)"
                  : "0 0 15px rgba(0,0,0,0.4)",
              background:
                plan.id === "business_pro"
                  ? "radial-gradient(circle at top, #022c22, #020617)"
                  : "#020617",
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>{plan.name}</h2>
            <p style={{ marginBottom: 16, color: "#9ca3af" }}>{plan.description}</p>

            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
              {plan.price}
              {plan.interval && (
                <span style={{ fontSize: 16, color: "#9ca3af" }}>{plan.interval}</span>
              )}
            </div>

            <ul style={{ marginBottom: 16, paddingLeft: 18, color: "#e5e7eb" }}>
              {plan.features.map((f) => (
                <li key={f} style={{ marginBottom: 4 }}>
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
                background: plan.id === "business_pro" ? "#22c55e" : "#1d4ed8",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              {plan.buttonLabel}
            </a>
          </div>
        ))}
      </section>

      <p style={{ marginTop: 24, color: "#6b7280", fontSize: 12 }}>
        You can cancel your subscription any time. BizGuard helps you understand
        documents and risks but does not replace a licensed attorney.
      </p>
    </main>
  );
}
