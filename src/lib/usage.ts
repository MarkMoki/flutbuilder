type UsageRecord = { time: number; user?: string; event: string; amount?: number };
const usage: UsageRecord[] = [];
export function recordUsage(event: string, amount = 1, user?: string) {
  usage.push({ time: Date.now(), event, amount, user });
}
export function getUsage(limit = 100) { return usage.slice(-limit); }


