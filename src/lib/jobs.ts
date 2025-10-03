// Simple in-memory job types and store for prototyping
export type BuildKind = "flutter_source" | "android_apk";

export type BuildRequest = {
  id: string;
  kind: BuildKind;
  createdAt: number;
  status: "queued" | "running" | "succeeded" | "failed";
  input: {
    appSpecUrl?: string; // URL to JSON spec describing the Flutter app
    appSpecInline?: unknown; // Inline spec for quick prototyping
  };
  output?: {
    artifactUrl?: string;
    log?: string;
  };
  error?: string;
};

class InMemoryJobStore {
  private jobs: Map<string, BuildRequest> = new Map();
  private queue: string[] = [];

  enqueue(job: Omit<BuildRequest, "status" | "createdAt">): BuildRequest {
    const created: BuildRequest = {
      ...job,
      createdAt: Date.now(),
      status: "queued",
    };
    this.jobs.set(created.id, created);
    this.queue.push(created.id);
    return created;
  }

  next(): BuildRequest | undefined {
    const id = this.queue.shift();
    if (!id) return undefined;
    const job = this.jobs.get(id);
    if (!job) return undefined;
    job.status = "running";
    this.jobs.set(id, job);
    return job;
  }

  update(job: BuildRequest): void {
    this.jobs.set(job.id, job);
  }

  get(id: string): BuildRequest | undefined {
    return this.jobs.get(id);
  }

  list(limit = 50): BuildRequest[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

export const jobStore = new InMemoryJobStore();

export function generateJobId(prefix: string = "job"): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rnd}`;
}


