import { NextResponse } from "next/server";
import { log } from "@/lib/log";

export function handleApi<T extends (...args: any[]) => Promise<Response>>(fn: T) {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (e: any) {
      log("error", "api_error", { message: e?.message });
      return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
    }
  } as T;
}


