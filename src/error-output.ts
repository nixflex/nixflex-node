import { NixflexError, NixflexOutcomeUnknownError } from './errors.js';

/** Preserve the CLI error envelope; uncertainty is additive and machine-readable. */
export function errorOutput(e: NixflexError) {
  return { error: { code: e.code, status: e.status, message: e.message, doc_url: e.docUrl,
    ...(e instanceof NixflexOutcomeUnknownError ? {
      outcome: e.outcome, safe_to_retry: e.safe_to_retry,
      request_id: e.requestId, details: e.details,
    } : {}),
  } };
}
