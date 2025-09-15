// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

type Profile = {
  email: string;
  language: string;
  industry: string;
  companyName: string;
};

const STORAGE_KEY = "sb_profile_v1";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>({
    email: "",
    language: "en",
    industry: "",
    companyName: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    alert("Saved locally. (No DB yet — we’ll persist this later!)");
  };

  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Dashboard</h1>
      <p>We’ll personalize answers using this profile (stored locally for now).</p>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="owner@example.com"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Company name
          <input
            value={profile.companyName}
            onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
            placeholder="Acme Logistics LLC"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Industry
          <input
            value={profile.industry}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            placeholder="Trucking, Restaurant, Retail…"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Language
          <select
            value={profile.language}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="zh">中文 (Chinese)</option>
          </select>
        </label>

        <button onClick={save} style={{ padding: "10px 14px" }}>Save profile</button>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2>Ask your AI (coming soon)</h2>
        <p>
          This will become your chat interface. We’ll tailor answers using your profile and
          subscription.
        </p>
        <p>For now, go to <a href="/billing">Billing</a> to start a test subscription.</p>
      </section>
    </main>
  );
}
