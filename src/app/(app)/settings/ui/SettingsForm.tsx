// src/app/(app)/settings/ui/SettingsForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active?: boolean;
};

export default function SettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);

    setSaving(false);
    setMsg(error ? error.message : "Saved!");
  }

  return (
    <form onSubmit={onSubmit} className="border p-4 rounded space-y-3">
      <label className="block">
        <span className="text-sm">Full name</span>
        <input
          className="mt-1 w-full border rounded p-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <div className="text-sm text-gray-600">Email: {profile?.email ?? "—"}</div>

      <button className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </button>

      {msg && <div className="text-sm mt-2">{msg}</div>}
    </form>
  );
}
