import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const DEMO = String(process.env.DEMO_MODE).toLowerCase() === "true";

export async function POST(req: NextRequest) {
  try {
    const { text, goal = "Summarize for a non-lawyer in plain English." } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    // Demo mode: return a fake-but-useful summary so you can click around
    if (DEMO) {
      const demo = [
        "Plain-English summary:",
        "• This appears to be a notice to vacate (move-out notice) from a landlord.",
        "• It usually means: pay what’s owed or leave by the listed date.",
        "• If you stay beyond that date, the landlord can file an eviction case.",
        "• Next steps: check the deadline, the reason given, and your state’s rules; consider replying in writing or seeking local legal aid."
      ].join("\n");
      return NextResponse.json({ result: demo });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing in .env.local" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const prompt = `You are a paralegal assistant.\nGoal: ${goal}\n\nTEXT:\n${text}`;

    // Use a generally available model; adjust if your account supports others
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful paralegal assistant. Be clear and concise." },
        { role: "user", content: prompt },
      ],
    });

    const output = completion.choices[0]?.message?.content || "No output";
    return NextResponse.json({ result: output });
  } catch (err: any) {
    // Friendly error messages
    const raw =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Server error";
    return NextResponse.json({ error: raw }, { status: 500 });
  }
}
