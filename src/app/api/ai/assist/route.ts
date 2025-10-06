import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { generateText } from "@/lib/ai";

function isSafePath(p: string): boolean {
  if (!p) return false;
  if (p.includes("..")) return false;
  if (p.startsWith("/")) return false;
  // Allow only project-relative files inside known roots
  return ["pubspec.yaml", "lib/", "android/", "test/"].some(prefix => p === prefix || p.startsWith(prefix));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const prompt: string = body?.prompt ?? "";
  const selectedPath: string | undefined = body?.selectedPath;
  const provider = typeof body?.provider === "string" ? body.provider : undefined;
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const files = workspaceStore.get(sessionId) ?? {};
  const contextExcerpt = Object.entries(files)
    .slice(0, 5)
    .map(([p, c]) => `FILE: ${p}\n${c.substring(0, 800)}`)
    .join("\n\n---\n\n");

  const system = `You are an AI Flutter code assistant. Follow these rules strictly:\n- Output one or more FILE blocks using this exact format:\n\nPATH: <relative-file-path>\n---\n<full file content>\n\n- Do not include partial diffs; always provide the full file content.\n- Only write inside: pubspec.yaml, lib/**, android/**, test/**.\n- Never output binaries or base64.\n- End your response with a short explanation prefixed by RATIONALE:.`;

  const fullPrompt = `${system}\n\nUSER:\n${prompt}\n\nCONTEXT:\n${contextExcerpt}\n\nSELECTED_FILE:${selectedPath ?? "(none)"}`;

  try {
    const aiText = await generateText(fullPrompt, { provider });

    // Parse one or more PATH blocks (supports optional fenced code handled by non-greedy match)
    const blocks = Array.from(aiText.matchAll(/PATH:\s*(.+?)\n[-]{3,}\n([\s\S]*?)(?=\nPATH:|\nRATIONALE:|$)/g));
    const updates: { path: string; content: string }[] = [];
    if (blocks.length > 0) {
      for (const b of blocks) {
        const p = b[1].trim();
        const c = b[2];
        if (!isSafePath(p)) continue;
        workspaceStore.update(sessionId, p, c);
        updates.push({ path: p, content: c });
      }
    } else if (selectedPath) {
      // If no PATH blocks, treat entire body as content for the selected file when present.
      if (isSafePath(selectedPath)) {
        workspaceStore.update(sessionId, selectedPath, aiText);
        updates.push({ path: selectedPath, content: aiText });
      }
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


