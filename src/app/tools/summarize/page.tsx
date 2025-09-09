"use client";
import { useState } from "react";

export default function SummarizeTool() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    try {
      setLoading(true);
      setOut("");
      setError("");
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOut(data.result);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-4 text-gray-900">
      <h1 className="text-3xl font-bold">AI Summarizer</h1>

      <textarea
        className="w-full h-56 rounded-xl border border-gray-300 bg-white p-3 text-base text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-black"
        placeholder="Paste legal text or a clause to summarize…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {loading ? "Summarizing…" : "Summarize"}
        </button>
        <a
          href="/"
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-900 hover:bg-gray-50"
        >
          Home
        </a>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {out && (
        <pre className="bg-gray-100 p-3 rounded-xl whitespace-pre-wrap text-sm text-gray-900">
          {out}
        </pre>
      )}
    </div>
  );
}
