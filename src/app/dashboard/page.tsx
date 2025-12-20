"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";

const LANGUAGES = [
  "English",
  "Spanish",
  "Punjabi",
  "Hindi",
  "Arabic",
  "Chinese",
  "Same language as my question",
];

export default function DashboardPage() {
  // ===== URL STATUS (e.g. checkout=success) =====
  const [checkoutStatus, setCheckoutStatus] = useState<
    "success" | "cancelled" | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get("checkout");
    if (checkout === "success") setCheckoutStatus("success");
    if (checkout === "cancelled") setCheckoutStatus("cancelled");
  }, []);

  // ===== Q&A STATE =====
  const [qaIndustry, setQaIndustry] = useState("");
  const [qaLanguage, setQaLanguage] = useState("Same language as my question");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  // ===== DOCUMENT REVIEW STATE =====
  const [docIndustry, setDocIndustry] = useState("");
  const [docLanguage, setDocLanguage] = useState("Same language as my question");
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [docText, setDocText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [docResult, setDocResult] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // ---------- Q&A SUBMIT ----------
  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    setQaError(null);
    setAnswer(null);

    if (!question.trim()) {
      setQaError("Please enter a question.");
      return;
    }

    try {
      setQaLoading(true);

      const res = await fetch("/api/legal/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          industry: qaIndustry,
          language: qaLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const answerText =
        data.answer ??
        data.message ??
        (typeof data === "string" ? data : JSON.stringify(data));

      setAnswer(answerText);
    } catch (err: any) {
      console.error(err);
      setQaError(err.message || "Error calling legal assistant.");
    } finally {
      setQaLoading(false);
    }
  };

  // ---------- FILE CHANGE (DOC REVIEW) ----------
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setDocError(null);
    setDocResult(null);
    setImageBase64(null);
    setDocText("");

    const file = e.target.files?.[0];
    if (!file) return;

    setDocFileName(file.name);

    const isImage = file.type.startsWith("image/");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageBase64(result);
        setDocText("");
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) || "";
        if (!text.trim()) {
          setDocError("This file appears to be empty or unreadable as text.");
          return;
        }
        setDocText(text);
        setImageBase64(null);
      };
      reader.readAsText(file);
    }
  };

  // ---------- DOC REVIEW SUBMIT ----------
  const handleReview = async (e: FormEvent) => {
    e.preventDefault();
    setDocError(null);
    setDocResult(null);

    if (!docText.trim() && !imageBase64) {
      setDocError("Upload a document or paste its text first.");
      return;
    }

    try {
      setDocLoading(true);

      const body: any = {
        industry: docIndustry,
        language: docLanguage,
      };

      if (imageBase64) {
        body.imageBase64 = imageBase64;
      } else {
        body.documentText = docText;
      }

      const res = await fetch("/api/legal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Something went wrong.");
      }

      setDocResult(data.analysis || "No analysis returned.");
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Error reviewing document.");
    } finally {
      setDocLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 lg:flex-row">
        {/* LEFT COLUMN: Intro + Q&A */}
        <div className="flex-1 space-y-6">
          {/* Top Banner / Checkout status */}
          {checkoutStatus === "success" && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
              <p className="font-semibold">Subscription activated ✅</p>
              <p className="mt-1 text-emerald-100/80">
                You&apos;re all set. Ask questions and upload documents anytime.
              </p>
            </div>
          )}

          {checkoutStatus === "cancelled" && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold">Checkout cancelled</p>
              <p className="mt-1">
                No charge was made. You can choose a plan again whenever you&apos;re ready.
              </p>
            </div>
          )}

          {/* Hero / heading */}
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your Legal Copilot Dashboard
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Ask questions about contracts, compliance, or legal risks for your small
              business — in your own language. Then upload or paste documents (even
              images) to get a clear, plain-language review.
            </p>
          </header>

          {/* Q&A Card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/50 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Ask a legal question</h2>
                <p className="text-xs text-slate-400">
                  Quick questions about contracts, policies, or “can I do this?” issues.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Q&A
              </span>
            </div>

            <form onSubmit={handleAsk} className="space-y-4">
              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Business type / industry{" "}
                  <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={qaIndustry}
                  onChange={(e) => setQaIndustry(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-1"
                  placeholder="Restaurant, trucking company, barber shop, etc."
                />
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">Answer language</label>
                <select
                  value={qaLanguage}
                  onChange={(e) => setQaLanguage(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-1"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">Your question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-1"
                  placeholder="Example: I run a small restaurant. What should be in a vendor contract so I am protected if deliveries are late?"
                />
              </div>

              <button
                type="submit"
                disabled={qaLoading}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {qaLoading ? "Asking…" : "Ask Legal Copilot"}
              </button>
            </form>

            {qaError && (
              <p className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
                Error: {qaError}
              </p>
            )}

            {answer && (
              <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 whitespace-pre-wrap">
                {answer}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Document review */}
        <div className="flex-1">
          <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/50 sm:mt-16 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Review a document</h2>
                <p className="text-xs text-slate-400">
                  Contracts, letters, notices, screenshots of paperwork — we&apos;ll
                  summarize the key risks and obligations.
                </p>
              </div>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                Document review
              </span>
            </div>

            <form onSubmit={handleReview} className="space-y-4">
              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Business type / industry{" "}
                  <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={docIndustry}
                  onChange={(e) => setDocIndustry(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-1"
                  placeholder="Trucking company, restaurant, barbershop, etc."
                />
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">Answer language</label>
                <select
                  value={docLanguage}
                  onChange={(e) => setDocLanguage(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-1"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Upload document (images or text-based files)
                </label>
                <input
                  type="file"
                  accept="image/*,.txt,.md,.rtf,.doc,.docx,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
                />
                {docFileName && (
                  <p className="mt-1 text-xs text-slate-400">
                    Selected file: <span className="font-medium">{docFileName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Or paste document text here
                </label>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-1"
                  placeholder="Paste the contents of your contract, notice, or other document..."
                />
              </div>

              <button
                type="submit"
                disabled={docLoading}
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {docLoading ? "Reviewing…" : "Review document"}
              </button>
            </form>

            {docError && (
              <p className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
                Error: {docError}
              </p>
            )}

            {docResult && (
              <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 whitespace-pre-wrap">
                {docResult}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
