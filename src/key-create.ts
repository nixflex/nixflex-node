import { NixflexOutcomeUnknownError, errorFromResponse } from './errors.js';
import { SDK_VERSION } from './client.js';
import type { KeyCreateResponse } from './types/account.js';

/** Unauthenticated signup is also a mutation: one attempt, truthful lost-reply error. */
export async function createKey(params: { name?: string; email?: string }, baseUrl: string): Promise<KeyCreateResponse> {
  let res: Response;
  try {
    res = await fetch(baseUrl.replace(/\/+$/, '') + '/v1/keys', {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'User-Agent': `nixflex-node/${SDK_VERSION}` }, body: JSON.stringify(params),
      signal: AbortSignal.timeout(30_000),
    });
  } catch { throw new NixflexOutcomeUnknownError(); }
  const requestId = res.headers.get('x-request-id') || res.headers.get('x-railway-request-id') || undefined;
  let body;
  try { body = await res.json(); }
  catch {
    if (res.ok) throw new NixflexOutcomeUnknownError(res.status, null, requestId);
    body = null;
  }
  if (!res.ok) throw errorFromResponse(res.status, body, requestId,
    parseInt(res.headers.get('retry-after') || '0', 10) || 0, true);
  return body as KeyCreateResponse;
}
