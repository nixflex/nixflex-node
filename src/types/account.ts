// ============================================
// src/types/account.ts
// From docs.nixflex.com/api-reference/account/* (Aug 2026).
// ============================================

export interface KeyRotateResponse {
  message: string;
  /** Stays the same - only the secret rotates (Stripe model). */
  key_id: string;
  /** Shown ONCE. The old secret stops working the instant this returns. */
  key_secret: string;
}

export interface KeyCreateResponse {
  message: string;
  key_id: string;
  /** Shown ONCE - store it immediately. */
  key_secret: string;
}

/** The REAL /v1/usage response (verified live Aug 2026 - the docs page
 * described a different shape and is being corrected). All-time totals
 * plus the account limits and this months concurrency peak. */
export interface Usage {
  plan: string;
  total_calls: number;
  /** Fractional minutes, e.g. 551.54. */
  total_minutes: number;
  /** Nixflex charges only - carrier costs are billed to you by Twilio/Telnyx. */
  total_cost: number;
  rate_limit_per_minute: number;
  max_concurrent: number;
  peak_concurrent_this_month: number;
  rejected_at_cap_this_month: number;
}

export interface WebhookConfigResponse {
  ok?: boolean;
  phone_number?: string;
  url?: string | null;
}
