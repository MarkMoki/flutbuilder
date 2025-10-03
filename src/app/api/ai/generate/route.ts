import { NextRequest, NextResponse } from "next/server";
import { generateFromGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt ?? "";
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  try {
    const text = await generateFromGemini(prompt);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Gemini failed" }, { status: 500 });
  }
}


