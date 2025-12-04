import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This route handles BOTH:
// - Text-based documents (documentText)
// - Image-based documents (imageBase64: data URL string)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const documentText = body.documentText as string | undefined;
    const imageBase64 = body.imageBase64 as string | undefined;
    const industry = (body.industry as string | undefined) || "";
    const language = (body.language as string | undefined) || "English";

    if (!documentText && !imageBase64) {
      return NextResponse.json(
        { ok: false, error: "No document text or image provided." },
        { status: 400 }
      );
    }

    // Common system prompt for both text and image flows
    const systemPrompt = `
You are a careful, plain-language legal assistant for immigrant-owned small businesses.
You DO NOT give final legal advice. You only explain risk, issues, and next steps
in clear, simple language.

User's business industry: ${industry || "not specified"}.
User prefers answers in: ${language || "English"}.

For the document you receive, respond with:

1. Short Summary (3–5 bullet points)
2. Key Risks / Red Flags
3. Obligations or Deadlines
4. Suggested Questions to Ask a Lawyer
5. Plain-language Next Steps

Keep the tone calm, practical, and respectful. Avoid legalese.
    `.trim();

    let analysis: string | null = null;

    // ---- IMAGE PATH ----
    if (imageBase64) {
      // Analyze the image directly (OCR + legal analysis in one go)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This image contains a legal or business document. Read all visible text and analyze the document as requested.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          } as any,
        ],
        temperature: 0.2,
      });

      analysis =
        completion.choices[0]?.message?.content ||
        "Sorry, I could not generate an analysis from the image.";
    }

    // ---- TEXT PATH ----
    if (!analysis && documentText) {
      const trimmed = documentText.slice(0, 12000); // simple length guard

      const userPrompt = `
Here is the document content. Analyze it:

"""${trimmed}"""
      `.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });

      analysis =
        completion.choices[0]?.message?.content ||
        "Sorry, I could not generate an analysis.";
    }

    if (!analysis) {
      return NextResponse.json(
        { ok: false, error: "Could not generate analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      analysis,
    });
  } catch (err: any) {
    console.error("Document review error:", err);

    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Unknown error while reviewing document.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
