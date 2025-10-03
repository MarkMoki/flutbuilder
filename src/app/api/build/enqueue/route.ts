import { NextRequest, NextResponse } from "next/server";
import { jobStore, generateJobId, type BuildKind } from "@/lib/jobs";
import { workspaceStore, createFlutterScaffold } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind: BuildKind = body.kind;
    if (kind !== "flutter_source" && kind !== "android_apk") {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    const id = generateJobId(kind === "android_apk" ? "apk" : "src");
    const job = jobStore.enqueue({
      id,
      kind,
      input: {
        appSpecUrl: typeof body.appSpecUrl === "string" ? body.appSpecUrl : undefined,
        appSpecInline: body.appSpecInline,
      },
    });

    // Simulate progressive file generation and async build completion
    const spec = body.appSpecInline || {};
    const appName = spec.appName || "Flutbuilder App";
    const pages = (spec.pages ? String(spec.pages) : "home").split(",").map((p: string) => p.trim()).filter(Boolean);

    // Step 1: immediately create minimal scaffold (pubspec + main.dart placeholder)
    const initial = createFlutterScaffold(appName, []);
    workspaceStore.init(job.id, initial);

    // Step 2: progressively add screen files one-by-one, then finalize
    const mkScreen = (page: string) => {
      const safe = String(page || 'page').replace(/[^a-zA-Z0-9]/g, '');
      const cap = safe.charAt(0).toUpperCase() + safe.slice(1);
      return `import 'package:flutter/material.dart';\n\nclass ${cap}Screen extends StatelessWidget {\n  const ${cap}Screen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(appBar: AppBar(title: const Text('${cap}')), body: const Center(child: Text('${safe}')));\n  }\n}\n`;
    };

    // Update main.dart navigation and add screens incrementally
    const updateMainWithPages = (existingMain: string, currentPages: string[]) => {
      const imports = currentPages.map(p => `import 'screens/${p}.dart';`).join('\n');
      const navItems = currentPages.map(p => `ListTile(title: Text('${p}'))`).join(',\n            ');
      return `import 'package:flutter/material.dart';\n${imports}\n\nvoid main() => runApp(const MyApp());\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(title: '${appName}', theme: ThemeData.dark(), home: const HomeScreen());\n  }\n}\n\nclass HomeScreen extends StatelessWidget {\n  const HomeScreen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(appBar: AppBar(title: const Text('Home')), body: ListView(children: [\n            ${navItems}\n          ]));\n  }\n}\n`;
    };

    let addedPages: string[] = [];
    pages.forEach((p, idx) => {
      setTimeout(() => {
        // add screen file
        workspaceStore.update(job.id, `lib/screens/${p}.dart`, mkScreen(p));
        // update main.dart to include this page
        const current = workspaceStore.get(job.id) || {};
        const updatedPages = [...addedPages, p];
        const newMain = updateMainWithPages(current['lib/main.dart'] || '', updatedPages);
        workspaceStore.update(job.id, 'lib/main.dart', newMain);
        addedPages = updatedPages;
      }, 500 * (idx + 1));
    });

    // Finalize build status and artifact url
    setTimeout(() => {
      const current = jobStore.get(job.id);
      if (!current) return;
      current.status = "succeeded";
      current.output = { artifactUrl: `/api/workspace/zip?sessionId=${job.id}` };
      jobStore.update(current);
    }, 800 + 500 * pages.length);

    return NextResponse.json({ id: job.id, status: job.status });
  } catch (err) {
    return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
  }
}


