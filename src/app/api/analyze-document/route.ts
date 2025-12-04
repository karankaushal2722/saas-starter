// src/app/api/analyze-document/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Helper: get user email from cookie (same way we used "uid" elsewhere)
function getEmailFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get("uid")?.value ?? null;
}

// Limit how much text we send to the AI
function trimTextForModel(text: string, maxChars = 12000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[Document truncated for length]";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    // Basic size limit (5MB)
    const sizeInBytes = file.size ?? 0;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (sizeInBytes > maxSizeBytes) {
      return NextResponse.json(
        { ok: false, error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    const fileName = file.name || "document";
    const lowerName = fileName.toLowerCase();

    let textContent = "";

    if (lowerName.endsWith(".pdf")) {
      // Parse PDF
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text || "";
    } else {
      // Fallback: treat as text file
      textContent = await file.text();
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { ok: false, error: "Could not extract any text from the document." },
        { status: 400 }
      );
    }

    // Get user profile context (industry / language) if available
    const email = getEmailFromCookies();
    let profileContext = "";
    let userLanguage = "en";

    if (email) {
      const profile = await prisma.profile.findUnique({
        where: { email },
      });

      if (profile) {
        const pieces: string[] = [];

        if (profile.businessName) pieces.push(`Business name: ${profile.businessName}`);
        if (profile.industry) pieces.push(`Industry: ${profile.industry}`);
        if (profile.country) pieces.push(`Country: ${profile.country}`);
        if (profile.primaryLanguage) {
          userLanguage = profile.primaryLanguage;
          pieces.push(`Preferred language code: ${profile.primaryLanguage}`);
        }

        if (pieces.length > 0) {
          profileContext = pieces.join(" | ");
        }
      }
    }

    const trimmed = trimTextForModel(textContent);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Server missing OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are an AI assistant helping immigrant-owned small businesses understand documents such as contracts, leases, notices, and legal letters.",
            "You are NOT a lawyer and your answers are NOT legal advice. Always include a short disclaimer at the end.",
            "Focus on: obligations, rights, deadlines, financial risks, compliance issues, and any red flags.",
            "Explain things in clear, simple language. Assume the user is a non-lawyer.",
            "If the user has an industry or country specified, consider that in your analysis but do NOT fabricate specific local laws.",
            "If the user prefers a non-English language, answer in that language.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            profileContext ? `User profile context: ${profileContext}` : "No extra profile context.",
            `User preferred language code (if known): ${userLanguage}`,
            `Document name: ${fileName}`,
            "Here is the document text. Please:",
            "- Summarize the document in a few bullet points.",
            "- List key obligations and responsibilities.",
            "- Highlight any deadlines or time-sensitive items.",
            "- Point out any sections that might be risky or unfair to a small business owner.",
            "- Suggest questions the user should ask a real lawyer.",
            "",
            "Document text:",
            trimmed,
          ].join("\n"),
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const analysis =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate an analysis.";

    return NextResponse.json({ ok: true, analysis }, { status: 200 });
  } catch (error: any) {
    console.error("analyze-document error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message || "Something went wrong while analyzing the document.",
      },
      { status: 500 }
    );
  }
}
