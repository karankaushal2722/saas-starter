"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

type Record = {
  id: string;
  title: string;
  notes: string | null;
  created_at: string;
};

export default function RecordItem({ record }: { record: Record }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(record.title);
  const [notes, setNotes] = useState(record.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from("records").update({ title, notes }).eq("id", record.id);
    setSaving(false);
    setEditing(false);
    window.location.reload();
  }

  async function remove() {
    await supabase.from("records").delete().eq("id", record.id);
    window.location.reload();
  }

  if (editing) {
    return (
      <div className="border p-4 rounded space-y-2">
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="px-3 py-2 bg-black text-white rounded"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="px-3 py-2 border rounded"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded">
      <div className="flex justify-between">
        <div className="font-medium">{record.title}</div>
        <div className="text-sm opacity-60">
          {new Date(record.created_at).toLocaleString()}
        </div>
      </div>
      {record.notes && <p className="mt-2 whitespace-pre-wrap">{record.notes}</p>}
      <div className="mt-3 flex gap-2">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          className="px-3 py-1 border rounded"
          onClick={remove}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
