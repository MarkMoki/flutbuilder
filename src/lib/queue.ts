export type QueueJob<T> = { id: string; payload: T };
export interface Queue<T> {
  enqueue(job: QueueJob<T>): Promise<void>;
  process(handler: (job: QueueJob<T>) => Promise<void>): void;
}

export class InMemoryQueue<T> implements Queue<T> {
  private q: QueueJob<T>[] = [];
  private handler: ((job: QueueJob<T>) => Promise<void>) | null = null;
  async enqueue(job: QueueJob<T>) {
    this.q.push(job);
    this.tick();
  }
  process(handler: (job: QueueJob<T>) => Promise<void>) {
    this.handler = handler;
    this.tick();
  }
  private async tick() {
    if (!this.handler) return;
    const job = this.q.shift();
    if (!job) return;
    await this.handler(job);
  }
}

export function createQueue<T>(name: string): Queue<T> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return new InMemoryQueue<T>();
  const { Queue: BullQueue, Worker } = require("bullmq");
  const { default: IORedis } = require("ioredis");
  const connection = new IORedis(redisUrl);
  const q = new BullQueue(name, { connection });
  let handler: ((job: QueueJob<T>) => Promise<void>) | null = null;
  return {
    async enqueue(job) {
      await q.add(job.id, job.payload);
    },
    process(h) {
      handler = h;
      new Worker(name, async (bullJob: any) => {
        if (!handler) return;
        await handler({ id: String(bullJob.id), payload: bullJob.data });
      }, { connection });
    },
  };
}


