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

/** Your own S3-compatible recording storage (BYO storage). */
export interface StorageConfig {
  storage_enabled: boolean;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  access_key: string | null;
}
export interface StorageSetParams {
  /** The exact bucket name at your provider. */
  bucket: string;
  /** Access key ID with permission to write objects. */
  access_key: string;
  /** Secret access key. Write-only - stored encrypted, never returned. */
  secret_key: string;
  /** https:// endpoint of your provider. Leave empty for Amazon S3. */
  endpoint?: string;
  /** Your bucket's region. Defaults to auto. */
  region?: string;
}
export interface StorageSetResponse {
  ok: boolean;
  storage_enabled: boolean;
  bucket: string;
  endpoint: string | null;
  region: string;
  verified: boolean;
}
export interface StorageDeleteResponse {
  ok: boolean;
  storage_enabled: boolean;
}
/** Your own LLM (BYO LLM) - an OpenAI-compatible endpoint answers every call. */
export interface LlmConfig {
  byo_llm_enabled: boolean;
  endpoint: string | null;
  model: string | null;
}
export interface LlmSetParams {
  /** OpenAI-compatible https:// base URL, e.g. https://api.openai.com/v1 */
  endpoint: string;
  /** Model name as your provider knows it. Must support OpenAI-style tool calling. */
  model: string;
  /** Your provider API key. Write-only - stored encrypted, never returned. */
  api_key: string;
}
export interface LlmSetResponse {
  ok: boolean;
  byo_llm_enabled: boolean;
  endpoint: string;
  model: string;
  verified: boolean;
}
export interface LlmDeleteResponse {
  ok: boolean;
  byo_llm_enabled: boolean;
}

/** Your own TTS (BYO TTS) - your voice provider speaks on every phone call. */
export type TtsProvider = 'elevenlabs' | 'cartesia';
export interface TtsConfig {
  byo_tts_enabled: boolean;
  provider: TtsProvider | null;
  voice_id: string | null;
}
export interface TtsSetParams {
  /** 'elevenlabs' or 'cartesia'. */
  provider: TtsProvider;
  /** Voice ID exactly as shown in your provider console. */
  voice_id: string;
  /** Your provider API key. Write-only - stored encrypted, never returned. */
  api_key: string;
}
export interface TtsSetResponse {
  ok: boolean;
  byo_tts_enabled: boolean;
  provider: TtsProvider;
  voice_id: string;
  verified: boolean;
}
export interface TtsDeleteResponse {
  ok: boolean;
  byo_tts_enabled: boolean;
}