import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";

function ensureDep(pubspec: string, dep: string): string {
  // dep format: name:^version
  const [name, version] = dep.split(":");
  const reDeps = /(dependencies:\s*[\r\n]+)/m;
  if (!reDeps.test(pubspec)) {
    pubspec += `\ndependencies:\n`;
  }
  const has = new RegExp(`(^|\n)\s*${name}\s*:\s*`, "m").test(pubspec);
  if (has) return pubspec;
  // Insert under dependencies: section (naive but safe)
  return pubspec.replace(reDeps, (m) => m + `  ${name}: ${version || ''}\n`);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string = body?.sessionId ?? "default";
  const deps: string[] = Array.isArray(body?.deps) ? body.deps : [];
  if (deps.length === 0) return NextResponse.json({ error: "No deps provided" }, { status: 400 });

  const files = workspaceStore.get(sessionId) ?? {};
  const pub = files["pubspec.yaml"];
  if (typeof pub !== "string") return NextResponse.json({ error: "pubspec.yaml not found" }, { status: 404 });

  let updated = pub;
  for (const d of deps) updated = ensureDep(updated, d);

  if (updated !== pub) {
    workspaceStore.update(sessionId, "pubspec.yaml", updated);
  }
  return NextResponse.json({ ok: true, updated: updated !== pub });
}
