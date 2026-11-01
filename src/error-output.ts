import { NixflexError, NixflexOutcomeUnknownError } from './errors.js';

/** Preserve the CLI error envelope; uncertainty is additive and machine-readable. */
export function errorOutput(e: NixflexError) {
  return { error: { type: e.type, code: e.code, status: e.status, message: e.message, doc_url: e.doc_url,
    details: e.details, request_id: e.request_id,
    ...(e instanceof NixflexOutcomeUnknownError ? {
      outcome: e.outcome, safe_to_retry: e.safe_to_retry,
      request_id: e.request_id, details: e.details,
    } : {}),
  } };
}
