import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt ?? "";
  const provider = typeof body?.provider === "string" ? body.provider : undefined;
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  try {
    const text = await generateText(prompt, { provider });
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "AI failed" }, { status: 500 });
  }
}


