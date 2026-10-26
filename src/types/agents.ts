// ============================================
// src/types/agents.ts
// Types generated from docs.nixflex.com/api-reference/agents/* (Aug 2026).
// The docs are the single source of truth - when the API changes, the docs
// change, and this file changes in the same session (sync law).
// ============================================

export type ResponseLength = 'short' | 'medium' | 'long';
export type TransferType = 'cold' | 'warm';
export type AgentRetentionDays = 90 | 30 | 7 | 1 | 0;
export interface AgentExtractionField {
  name: string;
  type: 'text' | 'selector' | 'boolean' | 'number';
  description?: string;
  optional?: boolean;
  format_example?: string;
  choices?: string[];
}
export interface AgentContractSettings {
  voice_key?: string | null;
  timezone?: string;
  /** Confidence 0-1; silence in whole milliseconds, including 0. */
  stt_confidence?: number;
  stt_max_silence_ms?: number;
  incall_sms_enabled?: boolean;
  post_call_sms_enabled?: boolean;
  post_call_sms_template?: string;
  data_extraction_fields?: AgentExtractionField[];
  wait_tag_seconds?: number | null;
  ivr_timeout_seconds?: number;
  remember_callers?: boolean;
  require_booking_confirmation?: boolean;
  /** Legacy agent number/model settings, not a number import or model selection. */
  phone_number?: string | null;
  llm_model?: string;
}
export interface AgentWarning { code: 'unknown_fields'; fields: string[]; message: string; }

/** Parameters for creating an agent. Every field is optional - the API has
 * sensible defaults for all of them. `name` is the only one recommended. */
export interface AgentCreateParams extends AgentContractSettings {
  /** Display name (max 200 chars). Default "Untitled Agent". */
  name?: string;
  /** The AI's instructions (max 16000 chars ~ 4000 tokens). Over-limit is rejected with `prompt_too_long`. */
  system_prompt?: string;
  /** First line spoken on inbound calls. */
  welcome_message?: string;
  /** Voice name (browse in the dashboard). Default "Ashley". */
  voice_id?: string | null;
  /** Language code, or "multi" (follows the caller across 10 languages). Arabic, Hebrew, Korean, Chinese and Polish need their own code. */
  language?: string;
  /** Set false to disable without deleting. */
  is_active?: boolean;
  /** AI temperature 0-0.7. Explicit 0 is preserved; omitted defaults to 0.3. */
  temperature?: number;
  response_length?: ResponseLength;
  /** Agent greets the caller immediately. Default true. */
  ai_speaks_first?: boolean;
  /** New-agent default true: AI writes the inbound greeting from the prompt. */
  dynamic_greeting?: boolean;
  /** 0-100. Lower = harder to interrupt. Default 50. */
  interruption_sensitivity?: number;
  /** Milliseconds the agent waits after the caller stops speaking, 0-1000. Default 200. */
  response_eagerness?: number;
  /** Comma-separated words STT might mishear (staff names, treatments). Keep under 50 - too many are rejected at transcription time. */
  boosted_keywords?: string | null;
  /** Legacy pickup setting. This contract release does not change its handling or default (10). */
  pickup_delay?: number;
  /** Positive whole seconds; omitted create default 300. null uses the existing runtime fallback. */
  max_call_duration_seconds?: number | null;
  /** Positive whole seconds; omitted create default 10. null uses the existing runtime fallback. */
  silence_hangup_seconds?: number | null;
  /** Save call audio. Retention inherits the account default on create. Default true. */
  record_call?: boolean;
  /** Who records when record_call is on. 'provider' = your carrier records (whole call, including after a transfer to a person; carrier recording charges apply). 'nixflex' = the voice engine records the conversation itself at no extra cost; a transfer to a person is not included. Default 'provider'. */
  recording_source?: 'provider' | 'nixflex';
  /** Carrier answering-machine detection: fast hangup ~4s in, NO voicemail message, extra carrier cost. OFF lets the agent detect voicemail itself and leave a message. Default false. */
  amd_enabled?: boolean;
  /** Keypad digits instead of speech. Three-state: true/false explicit, null = not set (a number's own setting decides). */
  dtmf_enabled?: boolean | null;
  /** Leave a message on detected voicemails. Applies to DASHBOARD-imported numbers on
   * this agent; API-imported numbers use their own per-number setting instead. Enabling
   * without voicemail_message is rejected with voicemail_message_required. */
  voicemail_leave_enabled?: boolean;
  /** Spoken word for word on voicemail when enabled - the agent never rewrites it. */
  voicemail_message?: string | null;
  /** Where to POST post-call data. */
  webhook_url?: string | null;
  /** Enables duration/silence end-call timers; not an absolute model END_CALL prohibition. Default true. */
  func_end_call?: boolean;
  /** Warm-transfer briefing text. Empty = AI auto-generates from the conversation. */
  transfer_whisper?: string | null;
  /** Legacy, not enforced. Use incall_sms_enabled for the actual texting permission. */
  func_send_sms?: boolean;
  /** NOT ENFORCED - same as func_send_sms. Transfers are controlled by your prompt and transfer_number. */
  func_cold_transfer?: boolean;
  transfer_type?: TransferType;
  /** Default destination for transfers. */
  transfer_number?: string | null;
  /** IGNORED (legacy) - accepted for backwards compatibility, nothing reads it. Use speaking_rate. */
  voice_speed?: number;
  /** Speaking speed: 1 normal, 0.5 half, 1.5 fast. Clamped, not rejected. null = normal (NOT the same as 1). */
  speaking_rate?: number | null;
  /** Greet recognised returning callers by name. Default true. */
  greet_by_name?: boolean;
  /** Legacy compatibility field; not a configurable runtime fallback. */
  fallback_message?: string;
}

/** Empty/unknown-only updates fail. Mixed unknown keys return warnings.
 * Omitted fields keep their values; retention is update-only. */
export interface AgentUpdateParams extends AgentCreateParams { call_retention_days?: AgentRetentionDays; }

/** The agent object as the API returns it. */
export interface Agent {
  /** Read-only identity and historical fields are never create/update parameters. */
  id?: string;
  api_key_id?: string;
  voice_key?: string | null;
  timezone?: string | null;
  stt_confidence?: number | null;
  stt_max_silence_ms?: number | null;
  wait_tag_seconds?: number | null;
  ivr_timeout_seconds?: number | null;
  remember_callers?: boolean;
  require_booking_confirmation?: boolean;
  phone_number?: string | null;
  llm_model?: string | null;
  boosted_keywords?: string | null;
  twilio_account_sid?: string | null;
  greeting_language?: string | null;
  precall_webhook_url?: string | null;
  tester_scenarios?: unknown[];
  outbound_transfer_numbers?: unknown[];
  outbound_warm_transfer_numbers?: unknown[];
  outbound_post_call_sms_templates?: unknown[];
  outbound_max_duration_seconds?: number | null;
  outbound_silence_hangup_seconds?: number | null;
  agent_id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  voice_id: string | null;
  language: string;
  temperature: number;
  response_length?: ResponseLength;
  ai_speaks_first?: boolean;
  dynamic_greeting?: boolean;
  interruption_sensitivity?: number;
  pickup_delay?: number;
  max_call_duration_seconds: number | null;
  silence_hangup_seconds: number | null;
  record_call: boolean;
  recording_source: 'provider' | 'nixflex';
  func_end_call?: boolean;
  transfer_whisper?: string | null;
  func_send_sms?: boolean;
  func_cold_transfer?: boolean;
  transfer_type?: TransferType;
  transfer_number: string | null;
  webhook_url: string | null;
  voice_speed?: number;
  speaking_rate?: number | null;
  dtmf_enabled?: boolean | null;
  amd_enabled?: boolean;
  greet_by_name?: boolean;
  fallback_message: string;
  post_call_sms_enabled?: boolean;
  /** Texting during a call + automatic booking-confirmation texts. Default false for
   * new agents; agents created before this setting existed were switched on. */
  incall_sms_enabled?: boolean;
  post_call_sms_template?: string | null;
  voicemail_leave_enabled?: boolean;
  voicemail_message?: string | null;
  data_extraction_fields?: AgentExtractionField[];
  call_retention_days?: AgentRetentionDays;
  warnings?: AgentWarning[];
  response_eagerness?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentDeleteResponse {
  /** Legacy message "Agent deleted" means soft disable, NOT permanent erasure. */
  message: string;
}

export interface ListParams {
  /** Hard-capped at 200 per request (higher values are reduced, not rejected). */
  limit?: number;
  offset?: number;
}

/** Agents use strict bounds; other resources retain their existing ListParams rules. */
export interface AgentListParams {
  /** Whole number 1..200, default 100. Out-of-range values are rejected. */
  limit?: number;
  /** Whole number 0..1000000, default 0. */
  offset?: number;
  status?: 'active' | 'disabled' | 'all';
  /** Case-insensitive literal substring of name or agent_id, at most 200 characters. */
  search?: string;
}
