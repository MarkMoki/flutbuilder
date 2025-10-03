import { flags } from "@/lib/flags";
import { log } from "@/lib/log";

export function track(event: string, props?: Record<string, unknown>) {
  if (!flags.enableAnalytics) return;
  log("info", `analytics:${event}`, props);
}


