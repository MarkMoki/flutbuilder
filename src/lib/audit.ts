type AuditEvent = { time: number; actor?: string; action: string; meta?: Record<string, unknown> };
const events: AuditEvent[] = [];
export function audit(action: string, meta?: Record<string, unknown>, actor?: string) {
  events.push({ time: Date.now(), action, meta, actor });
}
export function getAuditEvents(limit = 50) { return events.slice(-limit); }


