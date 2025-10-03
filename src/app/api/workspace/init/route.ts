import { NextRequest, NextResponse } from "next/server";
import { workspaceStore, createFlutterScaffold } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const appName: string = body?.spec?.appName ?? "Flutbuilder App";
  const pagesRaw: string = body?.spec?.pages ?? "home";
  const pages = pagesRaw.split(",").map((p: string) => p.trim()).filter(Boolean);
  const files = createFlutterScaffold(appName, pages);
  workspaceStore.init(sessionId, files);
  return NextResponse.json({ sessionId, files });
}


