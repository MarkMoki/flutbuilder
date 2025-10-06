// Unified AI abstraction with provider selection and fallback
// Supports: Gemini (default), OpenAI (optional). Select via AI_PROVIDER env or per-call options.

import { generateFromGemini } from "./gemini";

export type AIProvider = "gemini" | "openai";

export type GenerateTextOptions = {
  provider?: AIProvider;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  // Future: stop sequences, topP, etc.
};

function getPreferredProvider(): AIProvider {
  const env = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  return env === "openai" ? "openai" : "gemini";
}

function hasOpenAI(): boolean {
  return typeof process.env.OPENAI_API_KEY === "string" && !!process.env.OPENAI_API_KEY.trim();
}

function hasGemini(): boolean {
  return typeof process.env.GEMINI_API_KEY === "string" && !!process.env.GEMINI_API_KEY.trim();
}

async function tryOpenAI(prompt: string, opts?: GenerateTextOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const system = opts?.system ? [{ role: "system", content: opts.system }] : [];
  const body = {
    model,
    temperature: typeof opts?.temperature === "number" ? opts.temperature : 0.3,
    max_tokens: typeof opts?.maxTokens === "number" ? opts.maxTokens : 2048,
    messages: [
      ...system,
      { role: "user", content: prompt },
    ],
  } as any;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return text;
}

async function tryGemini(prompt: string, opts?: GenerateTextOptions): Promise<string> {
  // generateFromGemini only accepts a single prompt; prepend system if provided.
  const finalPrompt = opts?.system ? `${opts.system}\n\nUSER:\n${prompt}` : prompt;
  return await generateFromGemini(finalPrompt);
}

export async function generateText(prompt: string, opts?: GenerateTextOptions): Promise<string> {
  const chosen = opts?.provider || getPreferredProvider();
  const providers: AIProvider[] = chosen === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];

  let lastErr: any = null;
  for (const p of providers) {
    try {
      if (p === "openai" && hasOpenAI()) return await tryOpenAI(prompt, opts);
      if (p === "gemini" && hasGemini()) return await tryGemini(prompt, opts);
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("No AI provider configured (set GEMINI_API_KEY or OPENAI_API_KEY)");
}
