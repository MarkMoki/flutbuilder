import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const files = workspaceStore.get(sessionId) ?? {};
  return NextResponse.json({ sessionId, files });
}


