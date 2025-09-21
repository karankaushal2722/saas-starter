"use client";

import { useState } from "react";

type Profile = {
  email: string;
  companyName?: string | null;
  industry?: string | null;
  language?: string | null;
  complianceFocus?: string | null;
  plan?: string | null;
};

export default function ProfilePage() {
  const [form, setForm] = useState<Profile>({ email: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setMessage(null);
    setError(null);
    if (!form.email) return setError("Enter an email first.");
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(form.email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      if (data.profile) setForm({ ...form, ...data.profile });
      else setMessage("No profile found. Fill in fields and click Save to create one.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      setMessage("Saved!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  return (
    <main className="max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {message && <div className="text-green-700">{message}</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-2">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
            placeholder="tester@example.com"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={loadProfile}
            className="rounded bg-gray-200 px-3 py-2"
            disabled={!form.email || saving}
          >
            Load
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm">Company Name</span>
          <input
            name="companyName"
            value={form.companyName ?? ""}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm">Industry</span>
          <input
            name="industry"
            value={form.industry ?? ""}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
            placeholder="Trucking, Retail, …"
          />
        </label>

        <label className="block">
          <span className="text-sm">Language</span>
          <input
            name="language"
            value={form.language ?? ""}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
            placeholder="en, es, pa…"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm">Compliance Focus</span>
          <input
            name="complianceFocus"
            value={form.complianceFocus ?? ""}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
            placeholder="IRS,DOT,FDA"
          />
        </label>

        <label className="block">
          <span className="text-sm">Plan</span>
          <input
            name="plan"
            value={form.plan ?? ""}
            onChange={onChange}
            className="mt-1 w-full rounded border p-2"
            placeholder="pro"
          />
        </label>
      </div>

      <button
        onClick={save}
        disabled={!form.email || saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </main>
  );
}
