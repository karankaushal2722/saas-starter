"use client";

import { useState } from "react";

type Profile = {
  companyName: string;
  industry: string;
  language: string;
  complianceFocus: string;
};

export default function DashboardPage() {
  // simple local state (client component)
  const [profile, setProfile] = useState<Profile>({
    companyName: "",
    industry: "",
    language: "en",
    complianceFocus: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // If you already created /api/profile, this will hit it.
      // If not, this still compiles; you can wire it later.
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save profile");
      }
      setMessage("Profile saved ✅");
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-8 text-sm text-gray-500">
        Store a few preferences so your assistant can tailor guidance to your business.
      </p>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Business profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Company name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={profile.companyName}
              onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="e.g., Kaushal Logistics LLC"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Industry</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={profile.industry}
              onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
              placeholder="e.g., Trucking, Restaurant, Retail"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Language</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={profile.language}
              onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pa">Punjabi</option>
              <option value="hi">Hindi</option>
              <option value="ur">Urdu</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Compliance focus</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={profile.complianceFocus}
              onChange={(e) => setProfile((p) => ({ ...p, complianceFocus: e.target.value }))}
              placeholder="e.g., IRS, DOT, FDA"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>

            {message && <span className="text-sm text-gray-600">{message}</span>}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Billing</h2>
        <p className="mb-4 text-sm text-gray-600">
          You can manage your subscription from the customer portal.
        </p>
        <a
          href="/api/billing/portal"
          className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Open customer portal
        </a>
      </section>
    </main>
  );
}
