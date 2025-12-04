// src/app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#0f172a",
        color: "white",
      }}
    >
      {/* NAVBAR */}
      <header
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "16px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background:
                "linear-gradient(135deg, #22c55e, #38bdf8)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>BizGuard</span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.9)",
              }}
            >
              Powered by Legal Copilot
            </span>
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <a href="#how-it-works" style={{ opacity: 0.8 }}>
            How it works
          </a>
          <a href="#for-who" style={{ opacity: 0.8 }}>
            Who it’s for
          </a>
          <a href="#languages" style={{ opacity: 0.8 }}>
            Languages
          </a>
          <a href="#pricing" style={{ opacity: 0.8 }}>
            Pricing
          </a>
          <Link
            href="/auth"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148, 163, 184, 0.8)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 16px 40px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 32,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148, 163, 184, 0.4)",
              fontSize: 12,
              marginBottom: 12,
              background: "rgba(15, 23, 42, 0.7)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "999px",
                background: "#22c55e",
              }}
            />
            Built for immigrant-owned small businesses
          </div>

          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Protect your business with{" "}
            <span style={{ color: "#38bdf8" }}>BizGuard</span> — your
            AI legal assistant in plain language.
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              color: "rgba(226, 232, 240, 0.9)",
              marginBottom: 20,
            }}
          >
            Upload contracts, leases, government letters, or compliance
            documents. BizGuard explains them in simple language, highlights
            risks, and suggests next steps — in English, Punjabi, Hindi,
            Spanish, Arabic, and more.
            <br />
            <br />
            <strong>
              Built for immigrant-owned businesses. Not a lawyer. Not legal
              advice — but a huge help before you call one.
            </strong>
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <Link
              href="/auth"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "black",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Get started – it’s free to try
            </Link>

            <Link
              href="/pricing"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(148, 163, 184, 0.8)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              View pricing
            </Link>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "rgba(148, 163, 184, 0.9)",
            }}
          >
            No credit card required during beta. Your documents stay private.
          </p>
        </div>

        {/* Right hero "card" */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background:
              "radial-gradient(circle at top, rgba(56,189,248,0.2), transparent), rgba(15,23,42,0.95)",
            border: "1px solid rgba(148, 163, 184, 0.3)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "rgba(148,163,184,0.9)",
              marginBottom: 8,
            }}
          >
            Example
          </p>

          <div
            style={{
              fontSize: 13,
              background: "rgba(15,23,42,0.9)",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(30,64,175,0.7)",
              marginBottom: 12,
            }}
          >
            <p style={{ color: "rgba(248, 250, 252, 0.92)" }}>
              <strong>Business owner:</strong> “I run a small trucking company.
              I got a letter from DOT about a possible audit. What is this
              saying and what should I do?”
            </p>
          </div>

          <div
            style={{
              fontSize: 13,
              background:
                "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(15,23,42,0.95))",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.7)",
            }}
          >
            <p style={{ marginBottom: 6 }}>
              <strong>BizGuard (Punjabi):</strong>
            </p>
            <p style={{ color: "rgba(209, 250, 229, 0.95)" }}>
              “ਇਹ ਚਿੱਠੀ ਤੁਹਾਨੂੰ ਦੱਸ ਰਹੀ ਹੈ ਕਿ Department of Transportation ਤੁਹਾਡੇ
              ਰਿਕਾਰਡ ਚੈੱਕ ਕਰ ਸਕਦਾ ਹੈ। ਇਸ ਵੇਲੇ ਕੋਈ ਜੁਰਮਾਨਾ ਨਹੀਂ ਲੱਗਿਆ, ਪਰ ਉਹ
              ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹਨ ਕਿ ਤੁਹਾਡੇ ਲੌਗ, ਮਾਈਲੇਜ ਅਤੇ ਟੈਕਸ ਡੌਕੂਮੈਂਟ ਸਹੀ ਹਨ
              ਜਾਂ ਨਹੀਂ…”
            </p>
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "rgba(148,163,184,0.9)",
              }}
            >
              + Summary, risks, and next steps you can take before calling a
              lawyer.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 16px 40px",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          How BizGuard protects your business
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(203,213,225,0.9)",
            marginBottom: 20,
          }}
        >
          No legal jargon. No judgment. Just clear explanations so you can make
          smarter decisions before you sign or respond.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <BulletCard title="1. Upload or snap">
            Upload PDFs, Word files, or even a photo of a paper document.
            Contracts, leases, DOT letters, landlord notices, and more.
          </BulletCard>
          <BulletCard title="2. Choose your language">
            English, Punjabi, Hindi, Spanish, Arabic, Chinese and more. Read
            and ask questions in the language you think in.
          </BulletCard>
          <BulletCard title="3. Get a clear breakdown">
            See summary, obligations, deadlines, red flags, and suggested
            questions to ask a real lawyer if needed.
          </BulletCard>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section
        id="for-who"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 16px 40px",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          BizGuard is built for real business owners, not big law firms
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(203,213,225,0.9)",
            marginBottom: 20,
          }}
        >
          Designed for owners who can&apos;t afford an in-house lawyer but still
          need to stay compliant and protected.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <BulletCard title="Trucking & logistics">
            FMCSA / DOT letters, broker contracts, lease-purchase agreements,
            insurance letters, and more.
          </BulletCard>
          <BulletCard title="Restaurants & food">
            Commercial leases, vendor contracts, health inspection notices,
            schedule / labor questions.
          </BulletCard>
          <BulletCard title="Retail & shops">
            Plaza leases, supplier terms, refund and return policies, sign or
            permit issues.
          </BulletCard>
          <BulletCard title="Services & contractors">
            Cleaning, construction, salons, daycare and more — proposals,
            estimates, and service agreements.
          </BulletCard>
        </div>
      </section>

      {/* LANGUAGES */}
      <section
        id="languages"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 16px 40px",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Understand documents in your own language
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(203,213,225,0.9)",
            marginBottom: 16,
          }}
        >
          BizGuard can read English documents and explain them in many
          languages. More languages will be added as we grow.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 13,
          }}
        >
          {[
            "English",
            "Punjabi",
            "Hindi",
            "Spanish",
            "Urdu",
            "Arabic",
            "Chinese",
            "French",
          ].map((lang) => (
            <span
              key={lang}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.7)",
                background: "rgba(15,23,42,0.9)",
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section
        id="pricing"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 16px 48px",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Simple pricing that respects small businesses
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(203,213,225,0.9)",
            marginBottom: 20,
          }}
        >
          Start free during beta. Upgrade only if BizGuard is saving you real
          time and money.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <PriceCard
            label="Starter (beta)"
            price="$0"
            per="/month"
            features={[
              "Ask basic legal questions",
              "Review a few documents each month",
              "Answers in your preferred language",
            ]}
          />

          <PriceCard
            label="Business"
            price="$29"
            per="/month"
            features={[
              "More document reviews per month",
              "Priority AI analysis",
              "Ideal for 1–3 location businesses",
            ]}
          />

          <PriceCard
            label="Business Pro"
            price="$49"
            per="/month"
            highlight
            features={[
              "Advanced document review",
              "Priority AI responses",
              "Designed for growing businesses",
            ]}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <Link
            href="/pricing"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "black",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            View full pricing & choose a plan
          </Link>
        </div>

        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "rgba(148,163,184,0.9)",
          }}
        >
          BizGuard helps you understand risk and ask better questions. It does
          not replace advice from a licensed attorney.
        </p>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(30,64,175,0.7)",
          padding: "12px 16px 20px",
          fontSize: 12,
          color: "rgba(148,163,184,0.9)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span>© {new Date().getFullYear()} BizGuard. All rights reserved.</span>
          <span>
            Built for families like ours — this is not legal advice, but it can
            help you feel less alone and more prepared.
          </span>
        </div>
      </footer>
    </main>
  );
}

type BulletCardProps = {
  title: string;
  children: React.ReactNode;
};

function BulletCard({ title, children }: BulletCardProps) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(30,64,175,0.8)",
        padding: 14,
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "rgba(203,213,225,0.9)" }}>{children}</p>
    </div>
  );
}

type PriceCardProps = {
  label: string;
  price: string;
  per: string;
  highlight?: boolean;
  features: string[];
};

function PriceCard({ label, price, per, highlight, features }: PriceCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: highlight
          ? "1px solid rgba(34,197,94,0.9)"
          : "1px solid rgba(30,64,175,0.7)",
        padding: 18,
        background: highlight
          ? "radial-gradient(circle at top, rgba(34,197,94,0.18), rgba(15,23,42,0.95))"
          : "rgba(15,23,42,0.9)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "rgba(148,163,184,0.9)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>{price}</span>
        <span style={{ fontSize: 12, color: "rgba(148,163,184,0.9)" }}>
          {per}
        </span>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          marginTop: 10,
          marginBottom: 12,
          fontSize: 13,
          color: "rgba(203,213,225,0.9)",
        }}
      >
        {features.map((f) => (
          <li key={f} style={{ marginBottom: 6 }}>
            • {f}
          </li>
        ))}
      </ul>

      <Link
        href="/pricing"
        style={{
          display: "inline-block",
          marginTop: 4,
          padding: "8px 14px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.9)",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        View details
      </Link>
    </div>
  );
}
