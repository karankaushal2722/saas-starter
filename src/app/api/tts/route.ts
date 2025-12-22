// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional: clean text a bit before sending to TTS
function cleanTextForTTS(text: string): string {
  return text
    .replace(/[*•#>\-]+/g, " ")
    .replace(/[`_]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' in request body." },
        { status: 400 }
      );
    }

    const cleaned = cleanTextForTTS(text);
    if (!cleaned) {
      return NextResponse.json(
        { error: "Text is empty after cleaning." },
        { status: 400 }
      );
    }

    // We don't have to do anything special with `language` here.
    // The TTS model can handle multilingual text directly.
    const tts = await openai.audio.speech.create({
      // Multilingual TTS model
      model: "gpt-4o-mini-tts",
      voice: "alloy", // neutral / assistant-style voice
      input: cleaned,
    });

    const audioBuffer = Buffer.from(await tts.arrayBuffer());

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[TTS] Error generating audio:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate TTS audio." },
      { status: 500 }
    );
  }
}
