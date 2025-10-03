import { NextRequest, NextResponse } from "next/server";
import { workspaceStore } from "@/lib/workspace";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const files = workspaceStore.get(sessionId) ?? {};

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), `flutbuilder-${sessionId}-`));
  const projectDir = path.join(tmpRoot, "app");
  await fs.mkdir(projectDir, { recursive: true });

  // Build or ensure worker image
  try {
    await exec(`docker image inspect flutbuilder-worker >/dev/null 2>&1 || docker build -f Dockerfile.worker -t flutbuilder-worker .`, { cwd: process.cwd(), shell: "/bin/bash" });
  } catch (e) {}

  // Run container to create a fresh flutter app and copy files, then build apk
  try {
    // Prepare output directory mounted to container
    const outputDir = path.join(tmpRoot, "output");
    await fs.mkdir(outputDir, { recursive: true });

    // Write provided files into temp overlay; we'll inject after flutter create
    for (const [p, content] of Object.entries(files)) {
      const dest = path.join(projectDir, p);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, content);
    }

    // Command: create app, overlay user files, build apk
    const dockerCmd = `docker run --rm -v ${tmpRoot}:/workspace -w /workspace flutbuilder-worker bash -lc "\
      set -e; \
      APP_NAME=app; \
      rm -rf app && flutter create $APP_NAME; \
      cp -R app/lib app_lib_backup; \
      if [ -d app/lib ]; then rm -rf app/lib; fi; \
      if [ -d app_lib_backup ]; then mkdir -p app; mv app_lib_backup app/lib; fi; \
      if [ -d app ]; then :; else mkdir -p app; fi; \
      if [ -d /workspace/app/lib ]; then cp -R /workspace/app/lib app/; fi; \
      if [ -f /workspace/app/pubspec.yaml ]; then cp /workspace/app/pubspec.yaml app/; fi; \
      cd app && flutter pub get && flutter build apk --release; \
      cp build/app/outputs/flutter-apk/app-release.apk /workspace/output/app.apk\
    "`;

    let attempts = 0;
    const maxAttempts = 2;
    let lastErr: any = null;
    while (attempts < maxAttempts) {
      try {
        await exec(dockerCmd, { cwd: process.cwd(), shell: "/bin/bash", timeout: 15 * 60_000 });
        lastErr = null; break;
      } catch (e) {
        lastErr = e; attempts += 1;
      }
    }
    if (lastErr) throw lastErr;

    const apk = await fs.readFile(path.join(outputDir, "app.apk"));
    return new NextResponse(apk, {
      headers: {
        "content-type": "application/vnd.android.package-archive",
        "content-disposition": `attachment; filename="${sessionId}.apk"`,
      },
    });
  } catch (e: any) {
    const msg = typeof e?.stderr === "string" ? e.stderr : (e?.message || "Build failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


