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

  const system = `You are an AI Flutter code assistant. Given the user's instruction and current workspace context, propose concrete code changes. Prefer returning one or more files in this format:\n\nPATH: <relative-file-path>\n---\n<full file content>\n\nRepeat the block for multiple files. Provide a brief rationale at the end prefixed by RATIONALE:.`;
  const fullPrompt = `${system}\n\nUSER:\n${prompt}\n\nCONTEXT:\n${contextExcerpt}\n\nSELECTED_FILE:${selectedPath ?? "(none)"}`;

  try {
    const aiText = await generateFromGemini(fullPrompt);

    // Parse one or more PATH blocks
    const blocks = Array.from(aiText.matchAll(/PATH:\s*(.+?)\n[-]{3,}\n([\s\S]*?)(?=\nPATH:|$)/g));
    const updates: { path: string; content: string }[] = [];
    if (blocks.length > 0) {
      for (const b of blocks) {
        const p = b[1].trim();
        const c = b[2];
        workspaceStore.update(sessionId, p, c);
        updates.push({ path: p, content: c });
      }
    } else if (selectedPath) {
      workspaceStore.update(sessionId, selectedPath, aiText);
      updates.push({ path: selectedPath, content: aiText });
    }

    // Extract rationale if present
    const rationaleMatch = aiText.match(/RATIONALE:\s*([\s\S]*)$/);
    const rationale = rationaleMatch ? rationaleMatch[1].trim().slice(0, 1000) : aiText.slice(0, 1000);

    return NextResponse.json({
      message: rationale,
      updates,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Assist failed" }, { status: 500 });
  }
}


