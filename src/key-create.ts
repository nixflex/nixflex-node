import { NixflexOutcomeUnknownError, errorFromResponse } from './errors.js';
import type { KeyCreateResponse } from './types/account.js';

/** Unauthenticated signup is also a mutation: one attempt, truthful lost-reply error. */
export async function createKey(params: { name?: string; email?: string }, baseUrl: string): Promise<KeyCreateResponse> {
  let res: Response;
  try {
    res = await fetch(baseUrl.replace(/\/+$/, '') + '/v1/keys', {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
    });
  } catch { throw new NixflexOutcomeUnknownError(); }
  const requestId = res.headers.get('x-railway-request-id') || undefined;
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
