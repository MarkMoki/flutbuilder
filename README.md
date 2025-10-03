Flutbuilder – SaaS AI Flutter App Builder
=========================================

This is the Next.js monorepo for Flutbuilder, a SaaS that generates fully functional Flutter apps and lets users download full source code or Android APK builds.

Stack
-----

- Next.js 14 (App Router, TypeScript, Tailwind)
- Supabase auth (email/password)
- Gemini AI assist (`/api/ai/assist`)
- Workspace APIs (init/get/update/zip)
- Dockerized Flutter worker for real APK builds
- Optional integrations: Prisma (Postgres), BullMQ (Redis), S3 storage

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
3. Environment variables (create `.env`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   GEMINI_API_KEY=...
   # Optional integrations
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://localhost:6379
   S3_BUCKET=your-bucket
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ADMIN_EMAILS=admin@example.com
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_ENABLE_AI=true
   ```

4. API routes:
   - Enqueue build: POST `/api/build/enqueue` with body `{ kind: "flutter_source" | "android_apk", appSpecUrl?, appSpecInline? }`
   - Build status: GET `/api/build/status?id=<jobId>`
   - List builds: GET `/api/build/list`

Architecture
-----------

- `src/lib/jobs.ts`: In-memory job store/queue used by API routes.
- `src/lib/workspace.ts`: In-memory source workspace with Flutter scaffolding.
- `src/lib/gemini.ts`: Gemini API integration.
- `src/lib/storage.ts`: Storage provider (S3 or memory fallback).
- `src/lib/queue.ts`: Queue abstraction (BullMQ or in-memory fallback).
- `src/lib/prisma.ts`: Prisma client (if `DATABASE_URL` is set).

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

Usage
-----

- Visit `/splash` → `/welcome` → `/signup` to create an account.
- Go to `/dashboard`, describe your app and pages, press Start Build.
- Watch code files appear in Code tab; use chat to refine code (supports multi-file updates via PATH blocks).
- Click Run to build a real APK (Docker + Flutter) and download it.

