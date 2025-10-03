Flutbuilder – SaaS AI Flutter App Builder
=========================================

This is the Next.js monorepo for Flutbuilder, a SaaS that generates fully functional Flutter apps and lets users download full source code or Android APK builds.

Stack
-----

- Next.js 14 (App Router, TypeScript, Tailwind)
- Minimal in-memory job queue for prototyping
- Worker Dockerfile to build Flutter source/APKs

Quick Start
----------

1. Install deps:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. API routes:
   - Enqueue build: POST `/api/build/enqueue` with body `{ kind: "flutter_source" | "android_apk", appSpecUrl?, appSpecInline? }`
   - Build status: GET `/api/build/status?id=<jobId>`
   - List builds: GET `/api/build/list`

Architecture
-----------

- `src/lib/jobs.ts`: In-memory job store/queue used by API routes.
- API orchestrates jobs; an external worker (see Dockerfile) would poll and execute builds, then update job records with artifact URLs.

Worker Image (local)
--------------------

Build a Docker image capable of building Flutter and APKs:
```bash
docker build -f Dockerfile.worker -t flutbuilder-worker .
```

Example usage (mount output dir):
```bash
docker run --rm -v $(pwd)/output:/output flutbuilder-worker bash -lc "git clone <app source> app && cd app && flutter pub get && flutter build apk --release && cp build/app/outputs/flutter-apk/app-release.apk /output/app.apk"
```

Notes
-----

- The current job store is in-memory only; replace with a database/queue for production (e.g., Postgres + BullMQ/Redis).
- Artifact storage is not implemented; integrate S3/GCS and sign URLs before release.
- Security/auth is not configured; add auth (e.g., NextAuth, Clerk) before public exposure.
