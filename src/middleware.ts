import { NextResponse } from "next/server";

const RATE_LIMIT = 60; // requests per minute per IP
const WINDOW_MS = 60_000;
const ipHits = new Map<string, { count: number; ts: number }>();

export function middleware(req: Request) {
  const url = new URL(req.url);
  // CORS (allow same-origin + simple preflight)
  if (req.method === "OPTIONS") {
    const res = NextResponse.json({}, { status: 204 });
    res.headers.set("Access-Control-Allow-Origin", url.origin);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "content-type, authorization");
    return res;
  }

  // Rate limit
  const ip = (req.headers.get("x-forwarded-for") || "")?.split(",")[0] || "127.0.0.1";
  const now = Date.now();
  const rec = ipHits.get(ip) || { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) {
    rec.count = 0; rec.ts = now;
  }
  rec.count += 1;
  ipHits.set(ip, rec);
  if (rec.count > RATE_LIMIT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};


