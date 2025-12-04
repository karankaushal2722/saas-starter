// src/app/api/legal/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const question = (body.question ?? "").trim();
    const language = (body.language ?? "auto").trim();
    const businessType = (body.businessType ?? "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are an AI legal assistant for small and immigrant-owned businesses.
Your job is to:
- Explain legal risks and concepts in simple, practical terms.
- Focus on compliance, contracts, and risk prevention.
- You are NOT a lawyer and your answers are not legal advice.
- Always encourage the user to consult a licensed attorney for serious or high-risk issues.

If the user specifies a language, answer fully in that language.
If no language is specified, answer in the same language the user uses.
Keep answers structured and concise, with bullet points where helpful.
`;

    const userPrompt = `
Language to respond in: ${language === "auto" ? "same as the user" : language}
Business type / industry: ${businessType || "not specified"}
User question:
${question}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer =
      completion.choices[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("Error in /api/legal/ask:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "Something went wrong while talking to OpenAI.",
      },
      { status: 500 }
    );
  }
}
