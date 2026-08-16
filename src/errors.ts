// ============================================
// src/errors.ts
// Typed error family. Mirrors the API's errorHelper shape EXACTLY
// (verified live Aug 2026):
//   { error: { type, code, message, doc_url, details } }
// Every non-2xx response becomes one of these - catchable by class:
//   try { ... } catch (e) { if (e instanceof NixflexRateLimitError) ... }
// ============================================

export interface NixflexAPIErrorBody {
  error: {
    type: string;
    code: string;
    message: string;
    doc_url?: string;
    details?: Record<string, unknown>;
  };
}

export class NixflexError extends Error {
  /** HTTP status of the failed response (0 for network/timeout failures). */
  readonly status: number;
  /** Machine-readable error code, e.g. 'invalid_json', 'rate_limit_exceeded'. */
  readonly code: string;
  /** Error category from the API, e.g. 'invalid_request', 'rate_limit'. */
  readonly type: string;
  /** Link to the error's documentation page. */
  readonly docUrl?: string;
  /** Structured extra info the API attached to this error. */
  readonly details: Record<string, unknown>;
  /** The x-railway-request-id (or similar) header when present - quote it to support. */
  readonly requestId?: string;

  constructor(status: number, body: NixflexAPIErrorBody | null, requestId?: string, fallbackMessage?: string) {
    const e = body?.error;
    super(e?.message || fallbackMessage || `Nixflex API error (HTTP ${status})`);
    this.name = 'NixflexError';
    this.status = status;
    this.code = e?.code || 'unknown_error';
    this.type = e?.type || 'error';
    this.docUrl = e?.doc_url;
    this.details = e?.details || {};
    this.requestId = requestId;
  }
}

/** 401 - missing or invalid API key. */
export class NixflexAuthenticationError extends NixflexError {
  constructor(...args: ConstructorParameters<typeof NixflexError>) {
    super(...args);
    this.name = 'NixflexAuthenticationError';
  }
}

/** 402 - balance or credit exhausted. */
export class NixflexPaymentRequiredError extends NixflexError {
  constructor(...args: ConstructorParameters<typeof NixflexError>) {
    super(...args);
    this.name = 'NixflexPaymentRequiredError';
  }
}

/** 404 - the resource does not exist (or is not yours). */
export class NixflexNotFoundError extends NixflexError {
  constructor(...args: ConstructorParameters<typeof NixflexError>) {
    super(...args);
    this.name = 'NixflexNotFoundError';
  }
}

/** 429 - rate limit hit. `retryAfterSeconds` says when to try again. */
export class NixflexRateLimitError extends NixflexError {
  readonly retryAfterSeconds: number;
  constructor(status: number, body: NixflexAPIErrorBody | null, requestId: string | undefined, retryAfterSeconds: number) {
    super(status, body, requestId);
    this.name = 'NixflexRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 400/422 - the request itself is malformed or invalid. */
export class NixflexInvalidRequestError extends NixflexError {
  constructor(...args: ConstructorParameters<typeof NixflexError>) {
    super(...args);
    this.name = 'NixflexInvalidRequestError';
  }
}

/** 5xx - something failed on Nixflex's side. Retried automatically once. */
export class NixflexServerError extends NixflexError {
  constructor(...args: ConstructorParameters<typeof NixflexError>) {
    super(...args);
    this.name = 'NixflexServerError';
  }
}

/** Network failure / timeout - the request never got an HTTP response. */
export class NixflexConnectionError extends NixflexError {
  constructor(message: string) {
    super(0, null, undefined, message);
    this.name = 'NixflexConnectionError';
  }
}

/** Map a status + body to the right error class. */
export function errorFromResponse(
  status: number,
  body: NixflexAPIErrorBody | null,
  requestId: string | undefined,
  retryAfterSeconds: number
): NixflexError {
  if (status === 401) return new NixflexAuthenticationError(status, body, requestId);
  if (status === 402) return new NixflexPaymentRequiredError(status, body, requestId);
  if (status === 404) return new NixflexNotFoundError(status, body, requestId);
  if (status === 429) return new NixflexRateLimitError(status, body, requestId, retryAfterSeconds);
  if (status === 400 || status === 422) return new NixflexInvalidRequestError(status, body, requestId);
  if (status >= 500) return new NixflexServerError(status, body, requestId);
  return new NixflexError(status, body, requestId);
}
