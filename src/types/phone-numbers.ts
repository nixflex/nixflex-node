// ============================================
// src/types/phone-numbers.ts
// From docs.nixflex.com/api-reference/phone-numbers/* (Aug 2026).
// ============================================

/** Import params - the carrier is INFERRED from which credentials you send.
 * Twilio: twilio_sid + twilio_token. Telnyx: telnyx_api_key + telnyx_connection_id
 * (the ID of a TeXML Application you created in your Telnyx portal, voice webhook
 * https://api.nixflex.com/telnyx-voice, POST, API v2, G711U on / HD Voice off). */
export interface PhoneNumberImportParams {
  /** E.164. Must already exist in your carrier account. */
  phone_number: string;
  /** The agent this number answers with. Must be yours. */
  agent_id: string;
  /** Twilio Account SID (AC + 32 hex). Twilio import. */
  twilio_sid?: string;
  /** Twilio Auth Token. Twilio import. WARNING: importing REPLACES the number's existing webhooks. */
  twilio_token?: string;
  /** Telnyx API key with access to the number. Telnyx import. */
  telnyx_api_key?: string;
  /** Your TeXML Application ID. Telnyx import. */
  telnyx_connection_id?: string;
  /** Optional Telnyx signature public-key candidate; saving does not verify it. */
  telnyx_public_key?: string;
  /** Per-number prompt override, max 8000 chars. */
  custom_prompt?: string;
}

export interface PhoneNumber {
  phone_number: string;
  agent_id: string;
  /** 'twilio' or 'telnyx'; absent from current Twilio-import/PATCH replies. */
  provider?: string;
  /** Twilio numbers only; null on other carriers. */
  twilio_number_sid?: string | null;
  telnyx_number_id?: string | null;
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  custom_prompt?: string | null;
  voice_id?: string | null;
  sms_reply_enabled?: boolean;
  /** This number's own voicemail setting - the ONLY one that applies to API-imported
   * numbers (dashboard-imported numbers follow the agent). null = not set = silent
   * hangup on voicemail. */
  voicemail_leave_enabled?: boolean | null;
  /** Spoken word for word on a detected voicemail when enabled. */
  voicemail_message?: string | null;
  sms_prompt?: string | null;
  web_prompt?: string | null;
  speaking_rate?: number | null;
  dtmf_enabled?: boolean | null;
  require_booking_confirmation?: boolean | null;
  monitor_enabled?: boolean;
  web_calls_enabled?: boolean;
  web_agent_enabled?: boolean;
  web_functions_enabled?: boolean;
  record_call?: boolean | null;
  recording_source?: 'provider' | 'nixflex' | null;
  created_at?: string;
  /** Descriptive origin only, never permission or a writable setting. */
  readonly source?: 'api' | 'dashboard' | null;
}

export interface TelnyxKeyStatus {
  provider: string | null;
  set: boolean;
  verified: boolean;
  fingerprint: string | null;
  previousKeyAcceptedUntil: string | null;
}

/** GET returns saved overrides (null stays null), not inherited agent settings. */
export interface PhoneNumberDetails {
  phone_number: string;
  agent_id: string | null;
  provider: 'twilio' | 'telnyx' | null;
  readonly source: 'api' | 'dashboard' | null;
  created_at: string | null;
  inbound_enabled: boolean | null;
  outbound_enabled: boolean | null;
  sms_reply_enabled: boolean | null;
  web_agent_enabled: boolean | null;
  web_calls_enabled: boolean | null;
  web_functions_enabled: boolean | null;
  monitor_enabled: boolean | null;
  custom_prompt: string | null;
  sms_prompt: string | null;
  web_prompt: string | null;
  voice_id: string | null;
  speaking_rate: number | null;
  dtmf_enabled: boolean | null;
  require_booking_confirmation: boolean | null;
  record_call: boolean | null;
  recording_source: 'provider' | 'nixflex' | null;
  voicemail_leave_enabled: boolean | null;
  voicemail_message: string | null;
  /** Website voice switch eligibility only; active/billing checks still apply. */
  readonly web_calls_effective: boolean;
  readonly telnyx_key_status: TelnyxKeyStatus;
}

export interface PhoneNumberListParams {
  agent_id?: string;
  provider?: 'twilio' | 'telnyx';
  /** Opt into paging, 1..100. With cursor alone defaults to 50. */
  limit?: number;
  /** Opaque cursor from next_cursor; keep account and filters unchanged. */
  cursor?: string;
}

/** Every field optional - send only what changes; omitted fields are untouched.
 * An EMPTY body is rejected. Only nullable fields accept null; see each field. */
export interface PhoneNumberUpdateParams {
  inbound_enabled?: boolean;
  outbound_enabled?: boolean;
  monitor_enabled?: boolean;
  web_calls_enabled?: boolean;
  web_agent_enabled?: boolean;
  /** Website visitors may use all enabled custom functions. Default OFF. */
  web_functions_enabled?: boolean;
  /** Telnyx webhook public-key candidate; saving it does not verify it. */
  telnyx_public_key?: string;
  require_booking_confirmation?: boolean | null;
  /** Business profile layered on the agent prompt for CALLS only. Max 8000. null clears. */
  custom_prompt?: string | null;
  /** Voice override for this number. null falls back to the agent's voice. */
  voice_id?: string | null;
  /** SMS agent auto-reply on/off. Default false. */
  sms_reply_enabled?: boolean;
  /** This number's own voicemail toggle - the only voicemail control for API-imported
   * numbers. Enabling without a message (here or already saved) is rejected with
   * voicemail_message_required. null clears. */
  voicemail_leave_enabled?: boolean | null;
  /** Spoken word for word on voicemail. Max 2000. null clears. */
  voicemail_message?: string | null;
  /** SMS agent instructions (independent channel). Max 20000. null clears. */
  sms_prompt?: string | null;
  /** Web agent instructions (independent channel). Max 20000. null clears. */
  web_prompt?: string | null;
  /** Speed override: 1 normal, clamped to range. null = INHERIT the agent's speed (send 1, not null, to force normal). */
  speaking_rate?: number | null;
  /** Keypad input: true/false explicit, null = inherit the agent's setting. */
  dtmf_enabled?: boolean | null;
  /** Recording: null = inherit; false stops recording this number while the agent keeps recording. */
  record_call?: boolean | null;
  /** Who records on this number: 'provider' (carrier) or 'nixflex' (voice engine). null = inherit the agent. Ignored while record_call is off. */
  recording_source?: 'provider' | 'nixflex' | null;
}

export interface PhoneNumberListResponse {
  phone_numbers: PhoneNumber[];
  /** Rows returned, NOT the account total. */
  count: number;
  /** Present only when limit/cursor opts into paging. */
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface PhoneNumberDeleteResponse {
  phone_number: { phone_number: string; deleted: boolean };
}

export interface MonitorToggleResponse {
  ok?: boolean;
  phone_number: string;
  monitor_enabled: boolean;
}

export interface WebCallsToggleResponse {
  ok?: boolean;
  phone_number: string;
  web_calls_enabled: boolean;
}
