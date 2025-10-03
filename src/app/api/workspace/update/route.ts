import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const path: string = body?.path ?? "";
  const content: string = body?.content ?? "";
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  workspaceStore.update(sessionId, path, content);
  return NextResponse.json({ ok: true });
}


