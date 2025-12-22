// src/app/api/legal/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

function buildToneInstructions(language: string | undefined): string {
  const lang = (language || "").toLowerCase();

  if (lang.includes("punjabi")) {
    return `
Speak like a friendly Punjabi business advisor.
Use simple, everyday Punjabi that people actually speak at home or in the shop.
Avoid very pure or literary Punjabi and avoid long, complex sentences.
It's OK (and natural) to mix common English business words like "contract", "fine", "invoice", "license".
Keep sentences short and clear so they are easy to speak out loud.
`.trim();
  }

  if (lang.includes("hindi")) {
    return `
Speak like a friendly Hindi-speaking business advisor.
Use normal, everyday Hindi that people use with family or coworkers.
Avoid Sanskrit-heavy or very formal Hindi and avoid long, complex sentences.
It's OK to mix common English business words like "contract", "license", "fine", "insurance" the way people really talk.
Keep sentences short and clear so they are easy to speak out loud.
`.trim();
  }

  if (lang.includes("spanish")) {
    return `
Speak like a friendly Spanish-speaking business advisor.
Use clear, everyday Spanish — not very formal, not like a legal contract.
Use short sentences and simple words so text-to-speech can read clearly.
`.trim();
  }

  if (lang.includes("arabic")) {
    return `
Speak like a friendly business advisor using modern, everyday Arabic.
Avoid very classical or overly formal phrasing.
Use short sentences and clear words so text-to-speech can read clearly.
`.trim();
  }

  if (lang.includes("chinese")) {
    return `
Speak like a friendly Chinese-speaking business advisor.
Use natural spoken-style Chinese, not very formal written language.
Use short sentences and clear words so text-to-speech can read clearly.
`.trim();
  }

  // Default / English
  return `
Use clear, everyday language, like you are talking to a busy small business owner.
Avoid legal jargon and very long sentences.
Prefer short sentences and simple words so text-to-speech can read clearly.
`.trim();
}

function buildLanguageInstruction(language: string | undefined): string {
  if (!language || language.toLowerCase().includes("same language")) {
    return `
Detect the language of the user's question and answer in that same language.
If the user mixes languages (for example Punjabi + English or Hindi + English),
you may also mix languages in a similar natural way if it helps understanding.
`.trim();
  }

  return `
Always answer in ${language}.
Do not switch back to English unless the user clearly asks you to.
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { question, industry, language } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing question." },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.slice(0, 4000);
    const toneInstructions = buildToneInstructions(language);
    const languageInstruction = buildLanguageInstruction(language);

    const systemPrompt = `
You are a plain-language legal explainer for immigrant-owned small businesses.
You do NOT act as a lawyer. You explain risks, options, and next steps in simple, practical language.

Business industry (if provided): ${industry || "not specified"}.

${languageInstruction}

${toneInstructions}

Very important:
- Use short sentences.
- Avoid fancy or academic words.
- Avoid formatting characters like "*", "•", "#", and code backticks.
- You may use numbered points like "1) 2) 3)" if it helps, but keep them short.

Focus on:
1) What the situation means for the user.
2) The main risks or things to watch out for.
3) Simple, practical next steps.
4) When they should talk to a licensed attorney.
    `.trim();

    const userPrompt = `
User's question:

"${trimmedQuestion}"

Answer in the style described above, in the correct language.
Use short, spoken-style sentences that are easy to read out loud.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate an answer.";

    return NextResponse.json({ answer: content });
  } catch (err: any) {
    console.error("Legal ask error:", err);
    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Unknown error while answering legal question.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
