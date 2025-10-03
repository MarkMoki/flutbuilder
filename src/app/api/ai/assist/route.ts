import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { generateFromGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const prompt: string = body?.prompt ?? "";
  const selectedPath: string | undefined = body?.selectedPath;
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const files = workspaceStore.get(sessionId) ?? {};
  const contextExcerpt = Object.entries(files)
    .slice(0, 5)
    .map(([p, c]) => `FILE: ${p}\n${c.substring(0, 800)}`)
    .join("\n\n---\n\n");

  const system = `You are an AI Flutter code assistant. Given the user's instruction and current workspace context, propose concrete code changes. If a file is selected, return the full revised content for that file. Return a short rationale.`;
  const fullPrompt = `${system}\n\nUSER:\n${prompt}\n\nCONTEXT:\n${contextExcerpt}\n\nSELECTED_FILE:${selectedPath ?? "(none)"}`;

  try {
    const aiText = await generateFromGemini(fullPrompt);

    // Try to parse a simple directive header like: PATH: lib/main.dart\n---\n<content>
    const match = aiText.match(/PATH:\s*(.+?)\n[-]{3,}\n([\s\S]*)/);
    let targetPath = selectedPath ?? undefined;
    let targetContent: string | undefined = undefined;
    if (match) {
      targetPath = match[1].trim();
      targetContent = match[2];
    } else if (selectedPath) {
      targetPath = selectedPath;
      targetContent = aiText;
    }

    if (targetPath && typeof targetContent === 'string') {
      workspaceStore.update(sessionId, targetPath, targetContent);
    }

    return NextResponse.json({
      message: aiText.slice(0, 2000),
      updatedPath: targetPath,
      updatedContent: targetContent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Assist failed" }, { status: 500 });
  }
}


