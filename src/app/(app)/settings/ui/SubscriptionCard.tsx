// src/app/(app)/settings/ui/SubscriptionCard.tsx
"use client";

import { useState } from "react";

export default function SubscriptionCard({
  isActive,
  email,
  priceId,
}: {
  isActive: boolean;
  email: string;
  priceId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upgrade() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, customerEmail: email }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setMsg("Could not start checkout.");
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Error starting checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-4 rounded space-y-2 max-w-md">
      <div>Status: {isActive ? "Active (Pro)" : "Free"}</div>

      {!isActive ? (
        <button
          onClick={upgrade}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Upgrade to Pro"}
        </button>
      ) : (
        <div className="text-sm text-gray-600">
          Your subscription appears active. Use the Stripe Customer Portal to manage it.
        </div>
      )}

      {msg && <div className="text-sm mt-2 text-red-600">{msg}</div>}
    </div>
  );
}
