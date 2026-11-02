import { open } from 'node:fs/promises';
import { basename } from 'node:path';
import { Transform } from 'node:stream';
import { encodeRequest } from '../request-body.js';
import { errorFromResponse, NixflexError, NixflexOutcomeUnknownError } from '../errors.js';
import type { RequestOptions } from '../client.js';
import { transferAbort, type TransferContext } from './transfer-context.js';

/** Only regular local files, <=10 MiB; bounded chunks, one POST, no redirect or retry. */
export async function uploadFile<T>(ctx: TransferContext, path: string, opts: RequestOptions = {}): Promise<T> {
  const metadata = encodeRequest(undefined, { ...opts, filename: opts.filename || basename(path) }).headers;
  const file = await open(path, 'r');
  let source: ReturnType<typeof file.createReadStream> | undefined;
  let bounded: Transform | undefined;
  let deadline: ReturnType<typeof transferAbort> | undefined;
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size <= 0 || info.size > 10 * 1024 * 1024)
      throw new RangeError('Choose a non-empty regular file up to 10 MiB.');
    if (ctx.url.pathname.endsWith('/replacements') && opts.expectedRevision === undefined)
      throw new TypeError('File replacement requires the source expectedRevision.');
    source = file.createReadStream({ highWaterMark: 64 * 1024, autoClose: false });
    let bytes = 0;
    bounded = new Transform({ transform(chunk, _encoding, done) {
      bytes += chunk.length;
      done(bytes > info.size ? new Error('The upload file changed.') : null, chunk);
    }, flush(done) { done(bytes !== info.size ? new Error('The upload file changed.') : null); } });
    source.on('error', error => bounded?.destroy(error));
    source.pipe(bounded);
    deadline = transferAbort(ctx.timeout, opts.signal);
    try {
      const res = await fetch(ctx.url, { method: 'POST', redirect: 'error',
        headers: { ...ctx.headers, ...metadata, 'Content-Type': 'application/octet-stream', 'Content-Length': String(info.size) },
        body: bounded as unknown as BodyInit, signal: deadline.signal, duplex: 'half' } as RequestInit);
      let data = null;
      try { data = await res.json(); } catch {
        if (res.ok) throw new NixflexOutcomeUnknownError(res.status);
      }
      if (!res.ok) throw errorFromResponse(res.status, data, res.headers.get('x-request-id') || undefined,
        Number(res.headers.get('retry-after')) || 0, true);
      return data as T;
    } catch (error) {
      if (error instanceof NixflexError) throw error;
      throw new NixflexOutcomeUnknownError();
    }
  } finally {
    deadline?.close(); source?.destroy(); bounded?.destroy(); await file.close();
  }
}
