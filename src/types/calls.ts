// ============================================
// src/types/calls.ts
// Types generated from docs.nixflex.com/api-reference/calls/* (Aug 2026).
// ============================================

export type CallDirection = 'inbound' | 'outbound' | 'web';
export type CallerSentiment = 'happy' | 'neutral' | 'frustrated';

/** Legacy call record. Retention/unfinished work can leave fields null or absent. */
export interface Call {
  call_id: string;
  agent_id: string | null;
  call_direction: CallDirection | null;
  /** Historical classification can differ from call_direction; web is a separate type. */
  call_type?: CallDirection | null;
  /** Caller's number, E.164. */
  from_number?: string | null;
  /** Number that was called, E.164. */
  to_number?: string | null;
  call_status: string | null;
  /** Epoch MILLISECONDS. On outbound this is when dialling began - BEFORE ringing. */
  start_timestamp: number | null;
  /** Epoch MILLISECONDS. */
  end_timestamp: number | null;
  /** Epoch milliseconds when ANSWERED, or null (inbound / older calls). Ring time = answered_at - start_timestamp. */
  answered_at?: number | null;
  /** Connected duration, not necessarily AI billed time. See calls.billing() for takeover proof. */
  duration_ms: number | null;
  /** Why the call ended: completed, transferred, voicemail_detected, silence_timeout,
   * ivr_timeout, max_duration_reached, caller_hangup (inbound), callee_hangup (outbound),
   * busy / failed / no-answer / canceled (carrier words for calls that never connected),
   * concurrency_limit, and rare infrastructure endings. */
  ended_reason: string | null;
  /** Minutes actually charged for this call. Transfers stop the meter at handoff, so
   * this can be less than duration_ms suggests - the recording runs to the end either way. */
  charged_minutes?: number | null;
  cost?: number | null;
  /** A single string, one turn per line - not an array of turn objects. */
  transcript?: string | null;
  call_summary?: string | null;
  caller_sentiment?: CallerSentiment | null;
  call_successful?: boolean | null;
  /** Fields pulled from the call, per the agent's extraction settings. */
  extracted_data?: Record<string, unknown> | null;
  /** Appointments booked during the call. */
  bookings?: unknown[] | null;
  /** Legacy pointer; null does not prove recording was off. Use calls.recording() for state and short link. */
  recording_url: string | null;
  recording_duration_s?: number;
  voicemail_detected?: boolean | null;
  voicemail_detection_method?: string | null;
  /** Carrier machine-detection verdict (e.g. 'human', 'machine_start'). Only when AMD is enabled. */
  amd_result?: string | null;
  call_reason?: string | null;
  caller_name?: string | null;
  /** Outbound campaign this call belongs to, or null. */
  campaign_id?: string | null;
  avg_latency_ms?: number;
  /** ISO 8601 (the only non-epoch timestamp on this object). */
  created_at: string;
}

/** Parameters for POST /v1/calls/outbound. */
export interface OutboundCallParams {
  /** The agent that handles the call. Must belong to your API key. */
  agent_id: string;
  /** Who to call, E.164 ("+447386172392", not "07386172392"). NOTE: the field is to_number, not `to` - `to` is the SMS endpoints' field. */
  to_number: string;
  /** Per-call purpose; may be retained with the call's actual prompt. Must not be empty. */
  prompt: string;
  /** Key-values interpolated as {{key}}. Supply every referenced key; missing values may refuse the call when validation is enabled. */
  dynamic_vars?: Record<string, string>;
  /** Which of your numbers to dial from. Must be outbound-enabled on this agent. Omit = the agent's first outbound-enabled number. */
  from_number?: string;
  /** Link this call to a batch campaign for reporting. */
  campaign_id?: string;
}

/** Fire-and-forget: returns immediately; ringing/conversation/ending happen
 * async. Set a webhook_url to receive call.completed when it ends. */
export interface OutboundCallResponse {
  call_id: string;
  status: string;
  to: string;
  from: string;
}

export interface BatchRecipient {
  phone: string;
  /** Injected as context automatically - no {{placeholders}} needed in the prompt. */
  variables?: Record<string, string>;
  /** Replaces the campaign prompt for this recipient only. */
  prompt_override?: string;
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Parameters for POST /v1/calls/batch. */
export interface BatchCampaignParams {
  agent_id: string;
  /** The call purpose for every call. Required. */
  prompt: string;
  /** The number to dial from - imported and attached to this agent. Twilio and Telnyx both work. */
  from_number: string;
  recipients: BatchRecipient[];
  /** Display name for the campaign. */
  name?: string;
  /** false (default): reject the whole request on any invalid phone. true: dial valid ones, list invalid in the response. */
  skip_invalid?: boolean;
  /** 'now' (default, launches immediately) or 'schedule'. */
  schedule_type?: 'now' | 'schedule';
  /** YYYY-MM-DD. Required when schedule_type is 'schedule'. */
  scheduled_date?: string;
  /** Calling window start, minutes since midnight (540 = 9:00am). */
  window_start_minutes?: number;
  /** Calling window end, minutes since midnight (1080 = 6:00pm). Overnight windows (start > end) are supported. */
  window_end_minutes?: number;
  window_days?: Weekday[];
  /** IANA timezone the window runs in (e.g. "Europe/London"). Priority: this > the agent's timezone > Europe/London. One campaign = one timezone - split multi-country lists into separate campaigns. */
  timezone?: string;
}

export interface BatchInvalidEntry {
  phone: string;
  reason: string;
  row_index: number;
}

export interface BatchCreateResponse {
  campaign_id: string;
  status: string;
  valid_count: number;
  invalid_count: number;
  invalid: BatchInvalidEntry[];
}

export interface BatchLaunchResponse {
  campaign_id: string;
  status: string;
  recipients_count: number;
  queued_count: number;
}

export interface CallDeleteResponse {
  call_id: string;
  deleted: boolean;
  /** Legacy cleanup indicator; not proof an object existed or every copy was erased. */
  recording_deleted: boolean;
}

export interface CallDeleteAllResponse {
  deleted: boolean;
  calls_deleted: number;
  recordings_deleted: number;
  sms_deleted: number;
}
