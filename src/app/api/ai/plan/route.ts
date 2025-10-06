import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

function extractJson(input: string): any {
  // Try direct JSON parse first
  try {
    return JSON.parse(input);
  } catch {}
  // Try to extract the first JSON object substring
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = input.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  // Try code block fenced JSON
  const m = input.match(/```json\n([\s\S]*?)```/i) || input.match(/```\n([\s\S]*?)```/i);
  if (m && m[1]) {
    try { return JSON.parse(m[1]); } catch {}
  }
  throw new Error("Failed to parse plan JSON from AI output");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const description: string = body?.description ?? "";
  const category: string | undefined = body?.category;
  const provider = typeof body?.provider === "string" ? body.provider : undefined;
  if (!description) return NextResponse.json({ error: "Missing description" }, { status: 400 });

  const system = `You are a Flutter app planning assistant. Convert the user's description into a normalized plan in STRICT JSON ONLY. Do not include any commentary. The JSON schema:\n{\n  "appName": string,\n  "pages": string[], // slugs using a-z0-9 and underscores only\n  "routes": { "path": string, "screen": string }[], // path starts with '/', screen is PascalCase + 'Screen'\n  "deps": string[], // e.g., ["provider:^6.1.2", "http:^1.2.0"]\n  "models": { [name: string]: { [field: string]: string } } // field types as strings\n}\nRules:\n- Include at least a home page slug (e.g., "home").\n- Prefer minimal deps; include 'provider:^6.1.2' if state is needed.\n- Slugs must be safe for filenames.\n- Output ONLY JSON.`;

  const userPrompt = `Description: ${description}${category ? `\nCategory: ${category}` : ''}`;

  try {
    const text = await generateText(userPrompt, { provider, system, temperature: 0.2, maxTokens: 1200 });
    const plan = extractJson(text);
    // Basic normalization
    if (!Array.isArray(plan.pages) || plan.pages.length === 0) plan.pages = ["home"]; 
    plan.pages = plan.pages.map((p: string) => String(p || "").toLowerCase().replace(/[^a-z0-9_]/g, "_")).filter(Boolean);
    if (!Array.isArray(plan.deps)) plan.deps = [];
    // Ensure provider appears if referenced by routes/models or empty deps
    if (!plan.deps.some((d: string) => d.startsWith("provider"))) plan.deps.push("provider:^6.1.2");
    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Plan generation failed" }, { status: 500 });
  }
}
