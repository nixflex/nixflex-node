import { errorFromResponse, NixflexError, NixflexConnectionError } from '../errors.js';
import type { RequestOptions } from '../client.js';
import { transferAbort, type TransferContext } from './transfer-context.js';
/** Stream the exact JSON export envelope, including format=text. Never buffer the whole export. */
export async function* download(ctx: TransferContext, opts?: RequestOptions): AsyncGenerator<Uint8Array> {
  let emitted = false;
  for (let attempt = 0; ; attempt++) {
    const deadline = transferAbort(ctx.timeout, opts?.signal);
    let response: Response | undefined, reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let delay = 300 * (attempt + 1);
    try {
      response = await fetch(ctx.url, { method: 'GET', redirect: 'error', signal: deadline.signal,
        headers: { ...ctx.headers, Accept: 'application/json' } });
      if (!response.ok) {
        let data = null; try { data = await response.json(); } catch { /* typed safe error */ }
        if ((response.status === 429 || response.status >= 500) && attempt < ctx.retries) {
          delay = response.status === 429 ? Math.min(30, Math.max(0, Number(response.headers.get('retry-after')) || 1)) * 1000 : 500 * (attempt + 1);
        } else throw errorFromResponse(response.status, data, response.headers.get('x-request-id') || undefined, 0);
      } else {
        if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '') || !response.body)
          throw new NixflexConnectionError('The knowledge export did not return JSON.');
        reader = response.body.getReader();
        while (true) {
          const item = await reader.read();
          if (item.done) return;
          if (item.value.byteLength) { emitted = true; yield item.value; }
        }
      }
    } catch (error) {
      if (error instanceof NixflexError) throw error;
      if (emitted || opts?.signal?.aborted || attempt >= ctx.retries)
        throw new NixflexConnectionError('Knowledge download interrupted. Discard any partial file; it was not restarted.');
    } finally {
      try { if (reader) await reader.cancel(); else await response?.body?.cancel(); } catch { /* close only */ }
      deadline.close();
    }
    if (opts?.signal?.aborted) throw new NixflexConnectionError('Knowledge download cancelled.');
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
