import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { workspaceStore } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const files = workspaceStore.get(sessionId) ?? {};
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(blob, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${sessionId}-source.zip"`,
    },
  });
}


