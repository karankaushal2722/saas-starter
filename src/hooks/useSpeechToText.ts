// src/hooks/useSpeechToText.ts
"use client";

import { useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "listening" | "error";

export type UseSpeechToTextOptions = {
  /**
   * Default language code (BCP-47, e.g. "en-US", "hi-IN", "pa-IN").
   * You can override per call via toggleListening(langCode).
   */
  languageCode?: string;
  onResult?: (text: string) => void;
};

export function useSpeechToText(
  options: UseSpeechToTextOptions = {}
): {
  status: SpeechStatus;
  errorMessage: string | null;
  startListening: (languageCode?: string) => void;
  stopListening: () => void;
  toggleListening: (languageCode?: string) => void;
} {
  const { languageCode = "en-US", onResult } = options;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use `any` so we don't depend on DOM typings being present
  const recognitionRef = useRef<any | null>(null);
  const manuallyStoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn("This browser does not support SpeechRecognition");
      setErrorMessage(
        "Speech recognition is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = languageCode;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      manuallyStoppedRef.current = false;
      setStatus("listening");
      setErrorMessage(null);
    };

    recognition.onerror = (event: any) => {
      console.error("[speech] onerror", event.error);
      setStatus("idle");

      if (event.error === "not-allowed") {
        setErrorMessage("Mic access blocked. Check browser permissions.");
      } else if (event.error === "no-speech") {
        setErrorMessage(
          "I didn’t catch anything. Try speaking closer to the mic, with a short pause at the end."
        );
      } else if (event.error === "aborted") {
        // user manually stopped – no message
      } else {
        setErrorMessage("Speech recognition error: " + event.error);
      }
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      if (!results || results.length === 0) return;

      const lastResult = results[results.length - 1];
      if (!lastResult || !lastResult.isFinal) return;

      const transcript = lastResult[0]?.transcript?.trim();
      if (!transcript) return;

      onResult?.(transcript);
    };

    recognition.onend = () => {
      if (!manuallyStoppedRef.current) {
        setStatus("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [languageCode, onResult]);

  const startListening = (lang?: string) => {
    if (typeof window === "undefined") return;
    const rec = recognitionRef.current;
    if (!rec) return;

    if (lang) {
      try {
        rec.lang = lang;
      } catch (e) {
        console.warn("Failed to set recognition language:", lang, e);
      }
    }

    manuallyStoppedRef.current = false;
    try {
      rec.start();
      setStatus("listening");
      setErrorMessage(null);
    } catch (err) {
      console.error("[speech] start error", err);
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    manuallyStoppedRef.current = true;
    if (!rec) return;

    try {
      rec.stop();
      setStatus("idle");
    } catch (err) {
      console.error("[speech] stop error", err);
    }
  };

  const toggleListening = (lang?: string) => {
    if (status === "listening") {
      stopListening();
    } else {
      startListening(lang || languageCode);
    }
  };

  return {
    status,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
}
