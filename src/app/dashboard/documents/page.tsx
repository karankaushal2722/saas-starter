"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";

const LANGUAGES = ["English", "Spanish", "Punjabi", "Hindi", "Arabic", "Chinese"];

export default function DashboardPage() {
  // Q&A state
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("English");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  // Document review state
  const [docIndustry, setDocIndustry] = useState("");
  const [docLanguage, setDocLanguage] = useState("English");
  const [docText, setDocText] = useState("");
  const [docResult, setDocResult] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // ---------- Q&A ----------
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
          industry,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setAnswer(data.answer || "No answer returned.");
    } catch (err: any) {
      console.error(err);
      setQaError(err.message || "Error calling legal assistant.");
    } finally {
      setQaLoading(false);
    }
  };

  // ---------- DOCUMENT REVIEW ----------
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setDocError(null);
    setDocResult(null);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (!text.trim()) {
        setDocError("This file appears to be empty or unreadable as text.");
        return;
      }
      setDocText(text);
    } catch (err: any) {
      console.error(err);
      setDocError("Could not read that file. Try a .txt file or paste the text.");
    }
  };

  const handleReview = async (e: FormEvent) => {
    e.preventDefault();
    setDocError(null);
    setDocResult(null);

    if (!docText.trim()) {
      setDocError("Upload a document or paste its text first.");
      return;
    }

    try {
      setDocLoading(true);

      const res = await fetch("/api/legal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: docText,
          industry: docIndustry,
          language: docLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
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

  // ---------- UI ----------
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>Your Legal Copilot Dashboard</h1>
      <p>
        Ask questions about contracts, compliance, or legal risks for your small
        business — in your own language. Then upload or paste documents to get a
        clear, plain-language review.
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
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="trucking company, restaurant, store, etc."
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Answer language
              <br />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
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
                placeholder="Example: What are the IFTA requirements for my trucking company?"
              />
            </label>
          </div>

          <button type="submit" disabled={qaLoading} style={{ padding: "8px 16px" }}>
            {qaLoading ? "Asking…" : "Ask Legal Copilot"}
          </button>
        </form>

        {qaError && (
          <p style={{ color: "red", marginTop: 12 }}>
            Error: {qaError}
          </p>
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
          Upload a contract, notice, letter, or agreement (plain-text works
          best). We’ll summarize it and highlight risks, obligations, and next
          steps in simple language.
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
                placeholder="trucking company, restaurant, store, etc."
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
              Upload document (works best with .txt or other text-based files)
              <br />
              <input
                type="file"
                accept=".txt,.md,.rtf,.doc,.docx,.pdf"
                onChange={handleFileChange}
              />
            </label>
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

          <button type="submit" disabled={docLoading} style={{ padding: "8px 16px" }}>
            {docLoading ? "Reviewing…" : "Review document"}
          </button>
        </form>

        {docError && (
          <p style={{ color: "red", marginTop: 12 }}>
            Error: {docError}
          </p>
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
