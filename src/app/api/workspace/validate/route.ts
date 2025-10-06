import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

type AnalyzerIssue = {
  level: "info" | "warning" | "error" | string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
};

type TestSummary = {
  passed: boolean;
  raw: string;
};

function parseAnalyzer(raw: string): AnalyzerIssue[] {
  const issues: AnalyzerIssue[] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    // Typical format: "info • Some message • lib/main.dart:12:3 • some_code"
    if (!line.trim()) continue;
    const parts = line.split(" • ");
    if (parts.length >= 4) {
      const level = parts[0].trim().toLowerCase();
      const message = parts[1].trim();
      const loc = parts[2].trim();
      const code = parts[3]?.trim();
      const m = loc.match(/^(.*?):(\d+):(\d+)/);
      if (m) {
        issues.push({
          level,
          message,
          file: m[1],
          line: Number(m[2]),
          column: Number(m[3]),
          code,
        });
        continue;
      }
    }
    // Fallback: include as info
    issues.push({ level: "info", message: line });
  }
  return issues;
}

function parseTest(raw: string): TestSummary {
  const lower = raw.toLowerCase();
  const passed = lower.includes("all tests passed") || (!lower.includes("failed") && lower.includes("\u2714"));
  return { passed, raw };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const files = workspaceStore.get(sessionId) ?? {};

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), `flutbuilder-validate-${sessionId}-`));
  const projectDir = path.join(tmpRoot, "app");
  await fs.mkdir(projectDir, { recursive: true });

  // Ensure worker image exists (best-effort)
  try {
    await exec(`docker image inspect flutbuilder-worker >/dev/null 2>&1 || docker build -f Dockerfile.worker -t flutbuilder-worker .`, { cwd: process.cwd(), shell: "/bin/bash" });
  } catch {}

  // Write provided files into temp overlay
  for (const [p, content] of Object.entries(files)) {
    const dest = path.join(projectDir, p);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, content);
  }

  // Run container to create app, overlay files, flutter pub get, analyze and test
  const dockerCmd = `docker run --rm -v ${tmpRoot}:/workspace -w /workspace flutbuilder-worker bash -lc "\
    set -eo pipefail; \
    APP_NAME=app; \
    rm -rf app && flutter create $APP_NAME; \
    # Preserve generated app/lib if user did not provide lib
    cp -R app/lib app_lib_backup || true; \
    if [ -d /workspace/app/lib ]; then rm -rf app/lib && cp -R /workspace/app/lib app/; else mkdir -p app && mv app_lib_backup app/lib || true; fi; \
    if [ -f /workspace/app/pubspec.yaml ]; then cp /workspace/app/pubspec.yaml app/; fi; \
    if [ -d /workspace/app/android ]; then cp -R /workspace/app/android app/; fi; \
    cd app && flutter pub get; \
    ANALYZE_OUT=$(flutter analyze || true); \
    TEST_OUT=$(flutter test || true); \
    echo '-----ANALYZE_START-----'; \
    echo "$ANALYZE_OUT"; \
    echo '-----ANALYZE_END-----'; \
    echo '-----TEST_START-----'; \
    echo "$TEST_OUT"; \
    echo '-----TEST_END-----' \
  "`;

  try {
    const { stdout } = await exec(dockerCmd, { cwd: process.cwd(), shell: "/bin/bash", timeout: 10 * 60_000 });
    const analyzeRaw = (stdout.match(/-----ANALYZE_START-----([\s\S]*?)-----ANALYZE_END-----/) || ["", ""])[1].trim();
    const testRaw = (stdout.match(/-----TEST_START-----([\s\S]*?)-----TEST_END-----/) || ["", ""])[1].trim();
    const analyzerIssues = parseAnalyzer(analyzeRaw);
    const tests = parseTest(testRaw);

    return NextResponse.json({ ok: true, analyze: { raw: analyzeRaw, issues: analyzerIssues }, test: tests });
  } catch (e: any) {
    const msg = typeof e?.stderr === "string" ? e.stderr : (e?.message || "Validation failed");
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
