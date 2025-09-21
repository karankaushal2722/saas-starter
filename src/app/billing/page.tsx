// src/app/billing/page.tsx
"use client";

import { useState } from "react";

type Profile = {
  email?: string;
};

export default function BillingPage() {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [message, setMessage] = useState("");

  async function getEmailFromLocal(): Promise<string | undefined> {
    try {
      const raw = localStorage.getItem("sb_profile_v1");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Profile;
      return parsed.email || undefined;
    } catch {
      return undefined;
    }
  }

  async function startCheckout() {
    try {
      setMessage("");
      setLoading("checkout");
      const email = await getEmailFromLocal();

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setMessage("No checkout URL was returned.");
      }
    } catch (err: any) {
      setMessage(`Checkout failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    try {
      setMessage("");
      setLoading("portal");

      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setMessage("No portal URL was returned.");
      }
    } catch (err: any) {
      setMessage(`Portal failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Billing</h1>
      <p>
        Use test cards. After subscribing, success goes to{" "}
        <code>/api/billing/checkout/success</code> (you already saw your 200s in Vercel logs).
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={startCheckout} disabled={loading === "checkout"} style={{ padding: "10px 14px" }}>
          {loading === "checkout" ? "Starting Checkout…" : "Subscribe (Stripe Checkout)"}
        </button>

        <button onClick={openPortal} disabled={loading === "portal"} style={{ padding: "10px 14px" }}>
          {loading === "portal" ? "Opening Portal…" : "Manage Subscription (Portal)"}
        </button>
      </div>

      {message && (
        <p style={{ color: "crimson", marginTop: 16 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        Back to <a href="/">Home</a> or <a href="/dashboard">Dashboard</a>.
      </p>
    </main>
  );
}
