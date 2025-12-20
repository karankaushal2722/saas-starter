// src/app/dashboard/page.tsx
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";

type DashboardPageProps = {
  searchParams?: {
    checkout?: string;
  };
};

const LANGUAGES = [
  "English",
  "Spanish",
  "Punjabi",
  "Hindi",
  "Arabic",
  "Chinese",
  "Same language as my question",
];

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  const checkoutStatus = searchParams?.checkout;

  // ===== Q&A STATE =====
  const [qaIndustry, setQaIndustry] = useState("");
  const [qaLanguage, setQaLanguage] = useState("Same language as my question");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  // ===== DOCUMENT REVIEW STATE =====
  const [docIndustry, setDocIndustry] = useState("");
  const [docLanguage, setDocLanguage] = useState(
    "Same language as my question"
  );
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
      // Read as base64 data URL for image (JPG/PNG/…)
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageBase64(result);
        setDocText(""); // no raw text for images
      };
      reader.readAsDataURL(file);
    } else {
      // Treat as text-based document (txt, md, docx converted, etc.)
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
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      {/* Checkout status banner */}
      {checkoutStatus === "success" && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 6,
            border: "1px solid #16a34a",
            background: "#022c22",
            color: "#bbf7d0",
          }}
        >
          <strong>Welcome to BizGuard!</strong> Your subscription is active. You
          can start asking questions or uploading documents right away.
        </div>
      )}

      {checkoutStatus === "cancelled" && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 6,
            border: "1px solid #f59e0b",
            background: "#451a03",
            color: "#ffedd5",
          }}
        >
          Checkout was cancelled. You can still use the free tools here, or go
          back to the pricing page any time to upgrade.
        </div>
      )}

      <h1>Your Legal Copilot Dashboard</h1>
      <p>
        Ask questions about contracts, compliance, or legal risks for your small
        business — in your own language. Then upload or paste documents (even
        images) to get a clear, plain-language review.
      </p>

      {/* ===== Q&A SECTION ===== */}
      <section style={{ marginTop: 32, marginBottom: 48 }}>
        <h2>Ask a legal question</h2>

        <form onSubmit={handleAsk}>
          <div style={{ marginBottom: 12 }}>
            <label>
              Business type / industry (optional)
              <br />
              <input
                type="text"
                value={qaIndustry}
                onChange={(e) => setQaIndustry(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="Restaurant, trucking company, barber shop, etc."
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Answer language
              <br />
              <select
                value={qaLanguage}
                onChange={(e) => setQaLanguage(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Your question
              <br />
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: 8 }}
                placeholder="Example: I run a small restaurant. What should be in a vendor contract so I am protected if deliveries are late?"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={qaLoading}
            style={{ padding: "8px 16px" }}
          >
            {qaLoading ? "Asking…" : "Ask Legal Copilot"}
          </button>
        </form>

        {qaError && (
          <p style={{ color: "red", marginTop: 12 }}>Error: {qaError}</p>
        )}

        {answer && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #ccc",
              whiteSpace: "pre-wrap",
            }}
          >
            {answer}
          </div>
        )}
      </section>

      {/* ===== DOCUMENT REVIEW SECTION ===== */}
      <section style={{ marginTop: 32, marginBottom: 48 }}>
        <h2>Review a document</h2>
        <p style={{ maxWidth: 700 }}>
          Upload a contract, notice, letter, or agreement (including a photo of
          the document), or paste the text. We’ll summarize it and highlight
          risks, obligations, and next steps in simple language.
        </p>

        <form onSubmit={handleReview}>
          <div style={{ marginBottom: 12 }}>
            <label>
              Business type / industry (optional)
              <br />
              <input
                type="text"
                value={docIndustry}
                onChange={(e) => setDocIndustry(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="Trucking company, restaurant, barbershop, etc."
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Answer language
              <br />
              <select
                value={docLanguage}
                onChange={(e) => setDocLanguage(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Upload document (images or text-based files)
              <br />
              <input
                type="file"
                accept="image/*,.txt,.md,.rtf,.doc,.docx,.pdf"
                onChange={handleFileChange}
              />
            </label>
            {docFileName && (
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Selected file: {docFileName}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Or paste document text here
              <br />
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                rows={8}
                style={{ width: "100%", padding: 8 }}
                placeholder="Paste the contents of your contract, notice, or other document..."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={docLoading}
            style={{ padding: "8px 16px" }}
          >
            {docLoading ? "Reviewing…" : "Review document"}
          </button>
        </form>

        {docError && (
          <p style={{ color: "red", marginTop: 12 }}>Error: {docError}</p>
        )}

        {docResult && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #ccc",
              whiteSpace: "pre-wrap",
            }}
          >
            {docResult}
          </div>
        )}
      </section>
    </div>
  );
}
