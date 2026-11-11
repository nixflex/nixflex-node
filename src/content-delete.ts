import { NixflexServerError, type NixflexAPIErrorBody } from './errors.js';

/** B57's queue receipt is evidence of pending deletion, never success or a retry instruction. */
export function queuedContentDelete(method: string, path: string, status: number,
  body: NixflexAPIErrorBody | null, requestId?: string): NixflexServerError | undefined {
  const route = /^\/(?:calls\/batch|sms\/campaigns|calls)\/[^/]+$/.test(path);
  const error = body?.error, proof = error?.details;
  if (method === 'DELETE' && route && status === 503 && error?.code === 'hangup_pending' &&
      error.type === 'server_error' && typeof error.message === 'string' &&
      proof?.deleted === false && proof.retry_pending === true) {
    return new NixflexServerError(status, body, requestId);
  }
  return undefined;
}
