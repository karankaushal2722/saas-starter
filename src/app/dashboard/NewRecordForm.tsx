"use client";
import { useState } from "react";

export default function NewRecordForm() {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setText("");
      }}
      className="flex items-center gap-2"
    >
      <input
        className="w-full rounded border px-2 py-1"
        placeholder="(demo) add a note"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="rounded bg-black px-3 py-1 text-white">Add</button>
    </form>
  );
}
