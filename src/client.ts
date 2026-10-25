// ============================================
// src/client.ts
// The core HTTP client every resource uses. Industry-standard behaviours:
//  - Bearer auth (key_id:key_secret - the documented Nixflex scheme)
//  - Per-request timeout (default 30s) via AbortController
//  - Only GET reads retry, with bounded backoff. Changes never retry,
//    including DELETE, 429, network failures and lost/malformed replies.
//    An uncertain change reports outcome unknown: check before retrying.
//  - Typed errors (see errors.ts), request-id surfaced for support.
//  - Zero runtime dependencies: native fetch (Node 18+).
// ============================================

import {
  NixflexConnectionError,
  NixflexOutcomeUnknownError,
  errorFromResponse,
  type NixflexAPIErrorBody,
} from './errors.js';

export interface NixflexClientOptions {
  /** Your full API key: "nxf_xxx:nxfs_xxx" (key_id:key_secret). */
  apiKey: string;
  /** Override the API base URL (testing/staging). Default: https://api.nixflex.com */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default 30000. */
  timeoutMs?: number;
  /** Max automatic GET retries. Changes never retry. Default 1; 0 disables. */
  maxRetries?: number;
}

export interface RequestOptions {
  /** Override the client timeout for this one request. */
  timeoutMs?: number;
  /** AbortSignal to cancel the request from outside. */
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = 'https://api.nixflex.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const SDK_VERSION = '0.8.0'; // bump by hand with package.json on every release (was stuck at 0.1.0 until 0.6.0)

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(opts: NixflexClientOptions) {
    if (!opts || typeof opts.apiKey !== 'string' || !opts.apiKey.includes(':')) {
      throw new Error(
        'Nixflex: apiKey is required in the form "key_id:key_secret" (both parts, joined by a colon). ' +
        'Find yours at https://dashboard.nixflex.com under API Keys.'
      );
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? 1;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    reqOpts?: RequestOptions
  ): Promise<T> {
    const url = new URL(this.baseUrl + '/v1' + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const isRead = method === 'GET';
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt++;
      let res: Response;
      try {
        res = await this.fetchWithTimeout(url.toString(), method, body, reqOpts);
      } catch (err) {
        // No response does NOT prove that the server received nothing.
        if (!isRead) throw new NixflexOutcomeUnknownError();
        if (attempt <= this.maxRetries) {
          await sleep(300 * attempt);
          continue;
        }
        throw new NixflexConnectionError(
          `Could not reach the Nixflex API (${(err as Error)?.message || 'network error'}). Check connectivity and https://nixflex.com/status`
        );
      }

      if (res.ok) {
        if (res.status === 204) return undefined as T;
        try { return (await res.json()) as T; }
        catch {
          if (!isRead) throw new NixflexOutcomeUnknownError(res.status, null,
            res.headers.get('x-railway-request-id') || undefined);
          throw new NixflexConnectionError('The API read returned an incomplete or invalid JSON reply.');
        }
      }

      const requestId = res.headers.get('x-railway-request-id') || undefined;
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10) || 0;
      let errBody: NixflexAPIErrorBody | null = null;
      try { errBody = (await res.json()) as NixflexAPIErrorBody; } catch { /* non-JSON error body */ }

      const retryable429 = res.status === 429;
      const retryable5xx = res.status >= 500;
      if (isRead && (retryable429 || retryable5xx) && attempt <= this.maxRetries) {
        // Honour Retry-After on 429 (capped 30s); small backoff otherwise.
        const waitMs = retryable429 ? Math.min(retryAfter, 30) * 1000 || 1000 : 500 * attempt;
        await sleep(waitMs);
        continue;
      }

      throw errorFromResponse(res.status, errBody, requestId, retryAfter, !isRead);
    }
  }

  private async fetchWithTimeout(
    url: string,
    method: string,
    body: unknown,
    reqOpts?: RequestOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = reqOpts?.timeoutMs ?? this.timeoutMs;
    const timer = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    if (reqOpts?.signal) {
      if (reqOpts.signal.aborted) controller.abort(reqOpts.signal.reason);
      else reqOpts.signal.addEventListener('abort', () => controller.abort(reqOpts.signal!.reason), { once: true });
    }
    try {
      return await fetch(url, {
        method,
        redirect: method === 'GET' ? 'follow' : 'error',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': `nixflex-node/${SDK_VERSION}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
