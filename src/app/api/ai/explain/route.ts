import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { generateText } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const path: string = body?.path ?? "";
  const provider = typeof body?.provider === "string" ? body.provider : undefined;
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const files = workspaceStore.get(sessionId) ?? {};
  const content = files[path];
  if (typeof content !== "string") return NextResponse.json({ error: "File not found in workspace" }, { status: 404 });

  const system = `You are a senior Flutter engineer. Explain the given file in a concise manner.\nOutput sections:\n- Summary: ...\n- Key components: ...\n- Behavior: ...\n- Suggestions: ...`;
  const userPrompt = `FILE PATH: ${path}\n\nCONTENT:\n${content}`;

  try {
    const text = await generateText(userPrompt, { provider, system, temperature: 0.2, maxTokens: 1200 });
    return NextResponse.json({ explanation: text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Explain failed" }, { status: 500 });
  }
}
