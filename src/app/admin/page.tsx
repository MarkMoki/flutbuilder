import { jobStore } from "@/lib/jobs";
import { getAuditEvents } from "@/lib/audit";

export default function AdminPage() {
  const jobs = jobStore.list(100);
  const audits = getAuditEvents(50);
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Admin</h1>
      <h2 className="mt-6 text-lg font-semibold">Jobs</h2>
      <div className="text-sm text-white/80">
        {jobs.map(j => (
          <div key={j.id} className="border-b border-white/10 py-1">{j.id} — {j.kind} — {j.status}</div>
        ))}
      </div>
      <h2 className="mt-6 text-lg font-semibold">Audit</h2>
      <div className="text-sm text-white/80">
        {audits.map((a, i) => (
          <div key={i} className="border-b border-white/10 py-1">{new Date(a.time).toLocaleString()} — {a.action}</div>
        ))}
      </div>
    </div>
  );
}


