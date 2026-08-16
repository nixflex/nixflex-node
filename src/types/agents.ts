// ============================================
// src/types/agents.ts
// Types generated from docs.nixflex.com/api-reference/agents/* (Aug 2026).
// The docs are the single source of truth - when the API changes, the docs
// change, and this file changes in the same session (sync law).
// ============================================

export type ResponseLength = 'short' | 'medium' | 'long';
export type TransferType = 'cold' | 'warm';

/** Parameters for creating an agent. Every field is optional - the API has
 * sensible defaults for all of them. `name` is the only one recommended. */
export interface AgentCreateParams {
  /** Display name (max 100 chars). Default "Untitled Agent". */
  name?: string;
  /** The AI's instructions (max 16000 chars ~ 4000 tokens). Over-limit is rejected with `prompt_too_long`. */
  system_prompt?: string;
  /** First line spoken on inbound calls. */
  welcome_message?: string;
  /** Voice name (browse in the dashboard). Default "Ashley". */
  voice_id?: string;
  /** Language code, or "multi" (follows the caller across 10 languages). Arabic, Hebrew, Korean, Chinese and Polish need their own code. */
  language?: string;
  /** Set false to disable without deleting. */
  is_active?: boolean;
  /** AI temperature 0-1. Default 0.3. */
  temperature?: number;
  response_length?: ResponseLength;
  /** Agent greets the caller immediately. Default true. */
  ai_speaks_first?: boolean;
  /** AI improvises the greeting per call instead of the static welcome. */
  dynamic_greeting?: boolean;
  /** 0-100. Lower = harder to interrupt. Default 50. */
  interruption_sensitivity?: number;
  /** Milliseconds the agent waits after the caller stops speaking, 0-1000. Default 200. */
  response_eagerness?: number;
  /** Comma-separated words STT might mishear (staff names, treatments). Keep under 50 - too many are rejected at transcription time. */
  boosted_keywords?: string;
  /** Seconds the agent waits after pickup before speaking, 5-30. Default 10. */
  pickup_delay?: number;
  /** Hard cap on call length, 60-1800 seconds. Default 600. */
  max_call_duration_seconds?: number;
  /** Hang up if the caller is silent this long, 5-45 seconds. Default 30. */
  silence_hangup_seconds?: number;
  /** Save call audio. Recordings delete after 90 days. Default true. */
  record_call?: boolean;
  /** Carrier answering-machine detection: fast hangup ~4s in, NO voicemail message, extra carrier cost. OFF lets the agent detect voicemail itself and leave a message. Default false. */
  amd_enabled?: boolean;
  /** Keypad digits instead of speech. Three-state: true/false explicit, null = not set (a number's own setting decides). */
  dtmf_enabled?: boolean | null;
  /** Where to POST post-call data. */
  webhook_url?: string | null;
  /** Agent can end the call cleanly. Default true. */
  func_end_call?: boolean;
  /** Warm-transfer briefing text. Empty = AI auto-generates from the conversation. */
  transfer_whisper?: string | null;
  /** NOT ENFORCED - accepted and returned, but the engine does not read it. Control texting in your prompt. */
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
  /** Said when transcription fails. */
  fallback_message?: string;
}

/** Update accepts any create field; omitted fields keep their values.
 * Unrecognised field names return 200 and change NOTHING - check spelling
 * against the docs if a setting is not taking effect. */
export type AgentUpdateParams = AgentCreateParams;

/** The agent object as the API returns it. */
export interface Agent {
  agent_id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  voice_id: string;
  language: string;
  temperature: number;
  response_length?: ResponseLength;
  ai_speaks_first?: boolean;
  dynamic_greeting?: boolean;
  interruption_sensitivity?: number;
  pickup_delay?: number;
  max_call_duration_seconds: number;
  silence_hangup_seconds: number;
  record_call: boolean;
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
  post_call_sms_template?: string | null;
  data_extraction_fields?: unknown[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentDeleteResponse {
  agent_id: string;
  deleted: boolean;
}

export interface ListParams {
  /** Hard-capped at 200 per request (higher values are reduced, not rejected). */
  limit?: number;
  offset?: number;
}
