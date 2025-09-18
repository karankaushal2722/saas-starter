// src/app/login/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function pretendSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(`Pretend sign-in requested for ${email}. Replace with real Supabase sign-in later.`);
  }

  return (
    <div style={{ padding: 28, fontFamily: "Inter, system-ui, sans-serif", maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Login</h1>
      <p style={{ marginBottom: 12 }}>
        This placeholder resolves the middleware redirect to <code>/login</code>.
      </p>

      <form onSubmit={pretendSignIn} style={{ display: "grid", gap: 8, maxWidth: 450 }}>
        <label style={{ fontSize: 13 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 6, border: "1px solid #ddd" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "8px 12px", borderRadius: 6, background: "#111", color: "#fff" }}>
            Pretend Sign In
          </button>

          <Link href="/" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, textDecoration: "none" }}>
            Go to Home
          </Link>
        </div>

        {msg && <div style={{ marginTop: 8, color: "#555" }}>{msg}</div>}
      </form>
    </div>
  );
}
