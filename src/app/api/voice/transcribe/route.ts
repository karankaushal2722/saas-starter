// src/app/api/voice/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Use Whisper to transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1", // speech-to-text model
      // language: "en", // optional: set if you want to force a language
    });

    // transcription.text should be the recognized text
    const text = (transcription as any).text || transcription;

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[voice/transcribe] Error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to transcribe audio. Check server logs for details.",
      },
      { status: 500 }
    );
  }
}
