// src/app/dashboard/page.tsx
"use client";

import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

const LANGUAGES = [
  "English",
  "Spanish",
  "Punjabi",
  "Hindi",
  "Arabic",
  "Chinese",
  "Same language as my question",
];

// Map the UI language label to a BCP-47 language code for STT (input)
function languageLabelToCode(label: string): string {
  switch (label) {
    case "Spanish":
      return "es-ES";
    case "Punjabi":
      return "pa-IN"; // for speech input
    case "Hindi":
      return "hi-IN";
    case "Arabic":
      return "ar-SA";
    case "Chinese":
      return "zh-CN";
    case "English":
    case "Same language as my question":
    default:
      return "en-US";
  }
}

// Clean markdown / bullets / special characters before sending to TTS
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*•#>\-]+/g, " ")
    .replace(/[`_]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function DashboardPage() {
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

  // ===== SPEECH-TO-TEXT (for question input) =====
  const {
    status: speechStatus,
    errorMessage: speechError,
    toggleListening,
  } = useSpeechToText({
    onResult: (text) => {
      setQuestion((prev) => (prev ? `${prev.trim()} ${text}` : text));
    },
  });

  const isListening = speechStatus === "listening";

  // ===== SERVER-SIDE TTS PLAYBACK =====
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  const speakAnswer = useCallback(async () => {
    if (!answer) return;
    setTtsError(null);

    const cleaned = cleanTextForSpeech(answer);
    if (!cleaned) return;

    try {
      setIsSpeaking(true);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleaned,
          language: qaLanguage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data && (data as any).error) ||
          `TTS request failed with status ${res.status}`;
        console.error("[TTS] Error response:", msg);
        setTtsError(msg);
        setIsSpeaking(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Clean up old URL if any
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      currentAudioUrlRef.current = url;

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (err: any) {
      console.error("[TTS] Error calling /api/tts:", err);
      setTtsError(err?.message || "Error generating speech audio.");
    } finally {
      setIsSpeaking(false);
    }
  }, [answer, qaLanguage]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

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
        throw new Error((data as any).error || "Something went wrong.");
      }

      const answerText =
        (data as any).answer ??
        (data as any).message ??
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

      if (!res.ok || (data as any).ok === false) {
        throw new Error((data as any).error || "Something went wrong.");
      }

      setDocResult((data as any).analysis || "No analysis returned.");
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Error reviewing document.");
    } finally {
      setDocLoading(false);
    }
  };

  // ---------- SPEECH BUTTON HANDLER ----------
  const handleSpeakButtonClick = () => {
    const langCode = languageLabelToCode(qaLanguage);
    toggleListening(langCode);
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>Your Legal Copilot Dashboard</h1>
      <p>
        Ask questions about contracts, compliance, or legal risks for your small
        business — in your own language. Then upload or paste documents (even
        images) to get a clear, plain-language review.
      </p>

      {/* Hidden audio element for TTS playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsSpeaking(false)}
        style={{ display: "none" }}
      />

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

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="submit"
              disabled={qaLoading}
              style={{ padding: "8px 16px" }}
            >
              {qaLoading ? "Asking…" : "Ask Legal Copilot"}
            </button>

            <button
              type="button"
              onClick={handleSpeakButtonClick}
              style={{ padding: "8px 16px" }}
            >
              {isListening ? "Stop listening" : "Speak your question"}
            </button>

            {answer && (
              <button
                type="button"
                onClick={isSpeaking ? stopSpeaking : speakAnswer}
                style={{ padding: "8px 16px" }}
              >
                {isSpeaking ? "Stop voice playback" : "Speak this answer"}
              </button>
            )}
          </div>

          {speechError && (
            <p style={{ color: "red", marginTop: 8 }}>{speechError}</p>
          )}
          {ttsError && (
            <p style={{ color: "red", marginTop: 8 }}>TTS error: {ttsError}</p>
          )}
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
