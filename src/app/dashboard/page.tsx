// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

type Profile = {
  email: string;
  companyName?: string;
  industry?: string;
  language?: string;
  complianceFocus?: string;
};

const STORAGE_KEY = "sb_profile_email_v1";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({
    email: "",
    companyName: "",
    industry: "",
    language: "en",
    complianceFocus: "",
  });
  const [loading, setLoading] = useState(false);

  // restore last-used email
  useEffect(() => {
    const e = localStorage.getItem(STORAGE_KEY);
    if (e) setEmail(e);
  }, []);

  const loadProfile = async () => {
    if (!email) {
      alert("Enter an email first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data?.profile) {
        setProfile({
          email: data.profile.email,
          companyName: data.profile.companyName ?? "",
          industry: data.profile.industry ?? "",
          language: data.profile.language ?? "en",
          complianceFocus: data.profile.complianceFocus ?? "",
        });
      } else {
        // New profile stub
        setProfile({
          email,
          companyName: "",
          industry: "",
          language: "en",
          complianceFocus: "",
        });
      }
      localStorage.setItem(STORAGE_KEY, email);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile.email) {
      alert("No email set.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Save failed: ${data?.error ?? res.statusText}`);
      } else {
        alert("Profile saved!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Dashboard</h1>
      <p>We’ll tailor answers using your profile (now persisted in the database!).</p>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label>
          Lookup Email
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              style={{ flex: 1, padding: 8, marginTop: 4 }}
            />
            <button onClick={loadProfile} disabled={loading} style={{ padding: "10px 14px" }}>
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </label>

        <hr />

        <label>
          Email (key)
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

        <label>
          Compliance Focus
          <input
            value={profile.complianceFocus}
            onChange={(e) => setProfile({ ...profile, complianceFocus: e.target.value })}
            placeholder="IRS,DOT,FDA"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button onClick={saveProfile} disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Saving..." : "Save profile"}
        </button>
      </div>
    </main>
  );
}
