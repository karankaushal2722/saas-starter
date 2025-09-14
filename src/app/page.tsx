"use client";

import { useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "tester@example.com" }), // replace with logged-in user email later
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Welcome to SaaS Starter</h1>
      <p>Click below to subscribe:</p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          background: "black",
          color: "white",
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
        }}
      >
        {loading ? "Redirecting..." : "Subscribe Now"}
      </button>
    </main>
  );
}
