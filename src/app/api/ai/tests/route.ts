 import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { generateText } from "@/lib/ai";

function targetTestPath(filePath: string): string {
  const base = filePath.replace(/^lib\//, "");
  const dartName = base.replace(/\//g, "_").replace(/\.dart$/, "");
  return `test/${dartName}_test.dart`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const path: string = body?.path ?? "";
  const provider = typeof body?.provider === "string" ? body.provider : undefined;
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const files = workspaceStore.get(sessionId) ?? {};
  const content = files[path];
  if (typeof content !== "string") return NextResponse.json({ error: "File not found in workspace" }, { status: 404 });

  const system = `You are writing Flutter widget/unit tests. Return ONLY the full Dart test file content. Do not include commentary.\nRules:\n- Use flutter_test and material imports as needed.\n- If testing a StatelessWidget/StatefulWidget, use testWidgets with pumpWidget.\n- Avoid network or platform channels.\n- Keep it fast and deterministic.`;

  const userPrompt = `Write a Dart test for the following file.\nIt will be saved at: ${targetTestPath(path)}\n\nPATH: ${path}\n---\n${content}`;

  try {
    const testContent = await generateText(userPrompt, { provider, system, temperature: 0.1, maxTokens: 1200 });
    const outPath = targetTestPath(path);
    // Minimal sanity check: must be a Dart test file with main()
    if (!/void\s+main\s*\(\s*\)/.test(testContent) || !testContent.includes("package:flutter_test/flutter_test.dart")) {
      return NextResponse.json({ error: "Generated test did not meet minimal requirements" }, { status: 500 });
    }
    workspaceStore.update(sessionId, outPath, testContent);
    return NextResponse.json({ path: outPath, content: testContent });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Test generation failed" }, { status: 500 });
  }
}
