import type { RequestOptions } from '../client.js';
export interface TransferContext { url: URL; headers: Record<string, string>; timeout: number; retries: number }
export function transferContext(base: string, key: string, version: string, path: string, timeout: number,
  retries: number, options?: RequestOptions, query?: Record<string, string | undefined>): TransferContext {
  if (!path.startsWith('/') || path.startsWith('//') || /[?#\\]/.test(path)) throw new TypeError('Use a relative API path.');
  const url = new URL(base + '/v1' + path);
  for (const [name, value] of Object.entries(query || {})) if (value !== undefined) url.searchParams.set(name, value);
  const deadline = options?.timeoutMs ?? timeout;
  if (!Number.isFinite(deadline) || deadline <= 0) throw new RangeError('timeoutMs must be positive.');
  return { url, headers: { Authorization: 'Bearer ' + key, 'User-Agent': 'nixflex-node/' + version },
    timeout: deadline, retries };
}
export function transferAbort(timeout: number, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  return { signal: controller.signal, close: () => {
    clearTimeout(timer); signal?.removeEventListener('abort', abort); controller.abort();
  } };
}
