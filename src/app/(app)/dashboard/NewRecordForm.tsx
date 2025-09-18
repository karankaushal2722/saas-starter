"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NewRecordForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase.from("records").insert({
      user_id: userId,
      title,
      notes,
    });

    setTitle("");
    setNotes("");
    setLoading(false);

    // refresh dashboard
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="border p-4 rounded-lg space-y-3">
      <div className="font-medium">Create a Record</div>
      <input
        className="w-full border rounded p-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full border rounded p-2"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
