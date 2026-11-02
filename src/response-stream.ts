import { NixflexConnectionError, errorFromResponse } from './errors.js';
import type { RequestOptions } from './client.js';

/** GET only. Once a byte escapes, never restart an incomplete export. */
export async function* readStream(url: URL, headers: Record<string, string>, timeout: number,
  retries: number, opts?: RequestOptions): AsyncGenerator<Uint8Array> {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('timeoutMs must be positive.');
  let emitted = false;
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (opts?.signal?.aborted) abort();
    opts?.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeout);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let response: Response | undefined;
    let delay: number | undefined;
    try {
      response = await fetch(url, { method: 'GET', redirect: 'error', headers, signal: controller.signal });
      if (!response.ok) {
        let body = null;
        try { body = await response.json(); } catch { /* safe typed error below */ }
        const retryAfter = Math.max(0, parseInt(response.headers.get('retry-after') || '0', 10) || 0);
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          delay = response.status === 429 ? Math.min(retryAfter, 30) * 1000 || 1000 : 500 * (attempt + 1);
        } else {
          throw errorFromResponse(response.status, body, response.headers.get('x-request-id') || undefined, retryAfter);
        }
      } else {
        if (!/^text\/csv(?:;|$)/i.test(response.headers.get('content-type') || '') || !response.body) {
          throw new NixflexConnectionError('The activity export did not return CSV.');
        }
        reader = response.body.getReader();
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) return;
          if (chunk.value.byteLength) { emitted = true; yield chunk.value; }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name.startsWith('Nixflex')) throw error;
      if (emitted || opts?.signal?.aborted || attempt >= retries) {
        throw new NixflexConnectionError(emitted ? 'Activity export interrupted; discard the incomplete file. It was not restarted.' : 'Could not read the activity export.');
      }
      delay = 300 * (attempt + 1);
    } finally {
      try { if (reader) await reader.cancel(); else await response?.body?.cancel(); } catch { /* close only */ }
      controller.abort();
      clearTimeout(timer);
      opts?.signal?.removeEventListener('abort', abort);
    }
    if (opts?.signal?.aborted) throw new NixflexConnectionError('Activity export cancelled.');
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
