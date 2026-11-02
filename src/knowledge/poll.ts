import type { KnowledgeJob, JobPollOptions } from '../types/knowledge.js';
import { NixflexConnectionError } from '../errors.js';
/** Returns terminal state honestly, including failure/review. Never retries/cancels a job. */
export async function pollJob(read: (timeoutMs: number) => Promise<KnowledgeJob>, options: JobPollOptions = {}): Promise<KnowledgeJob> {
  const { maxAttempts = 20, intervalMs = 1000, timeoutMs = 30000, signal } = options;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100 ||
      !Number.isFinite(intervalMs) || intervalMs < 0 || intervalMs > 30000 ||
      !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 300000)
    throw new RangeError('Use 1..100 attempts, a 0..30000 ms interval and a timeout up to 300000 ms.');
  const end = Date.now() + timeoutMs;
  for (let n = 0; n < maxAttempts; n++) {
    if (signal?.aborted) throw new NixflexConnectionError('Knowledge polling cancelled; the server job was not cancelled.');
    if (Date.now() >= end) break;
    const job = await read(Math.max(1, end - Date.now()));
    if (['ready', 'failed', 'cancelled', 'deleted', 'needs_review'].includes(job.state)) return job;
    if (n + 1 >= maxAttempts) break;
    await new Promise<void>(resolve => {
      const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, Math.min(intervalMs, Math.max(0, end - Date.now())));
      signal?.addEventListener('abort', finish, { once: true });
    });
  }
  throw new NixflexConnectionError('Knowledge polling limit reached. Read the job again later; no change was sent.');
}
