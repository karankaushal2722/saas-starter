// src/app/api/analyze-document/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma"; // works now because lib/prisma has a default export

export const runtime = "nodejs";        // needed for Buffer / pdf-parse
export const dynamic = "force-dynamic"; // no caching

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function bufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(buffer);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const industry = (formData.get("industry") as string) || "";
    const language = (formData.get("language") as string) || "English";
    const userQuestion = (formData.get("question") as string) || "";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    // Read file into memory
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // ---- PDF handling via dynamic import of pdf-parse ----
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse: any =
        (pdfParseModule as any).default ?? (pdfParseModule as any);

      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || "";
    } else {
      // Fallback: treat as UTF-8 text (works for .txt, some docx exports, etc.)
      extractedText = bufferToUtf8(arrayBuffer);
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "I couldn't read any text from this file. Please try a different format (PDF or text).",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are a careful but plain-language legal assistant for immigrant-owned small businesses.
You DO NOT give final legal advice. You explain risk, issues, and next steps in simple language.

Business industry: ${industry || "not specified"}.
Answer language: ${language || "English"}.

For the document you receive, respond with:

1. Short Summary (3–5 bullet points)
2. Key Risks / Red Flags
3. Obligations or Deadlines
4. Suggested Questions to Ask a Lawyer
5. Plain-language Next Steps

If the user asked a specific question, answer it in that context as well.
`.trim();

    const userPrompt = `
Here is the document content:

"""${extractedText.slice(0, 12000)}"""

User question (optional): ${
      userQuestion || "No specific question provided. Just analyze the document."
    }
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const content =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate an analysis.";

    // Optional: log something to Prisma, if you want
    // await prisma.documentAnalysis.create({ data: { ... } });

    return NextResponse.json({ ok: true, analysis: content });
  } catch (err: any) {
    console.error("[analyze-document] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error while analyzing document.",
      },
      { status: 500 }
    );
  }
}
