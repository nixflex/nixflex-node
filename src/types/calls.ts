// ============================================
// src/types/calls.ts
// Types generated from docs.nixflex.com/api-reference/calls/* (Aug 2026).
// ============================================

export type CallDirection = 'inbound' | 'outbound';
export type CallerSentiment = 'happy' | 'neutral' | 'frustrated';

/** A call record. Both GET /calls and GET /calls/:id return this exact shape. */
export interface Call {
  call_id: string;
  agent_id: string;
  call_direction: CallDirection;
  /** Same meaning as call_direction; both are returned. */
  call_type?: CallDirection;
  /** Caller's number, E.164. */
  from_number: string;
  /** Number that was called, E.164. */
  to_number: string;
  call_status: string;
  /** Epoch MILLISECONDS. On outbound this is when dialling began - BEFORE ringing. */
  start_timestamp: number;
  /** Epoch MILLISECONDS. */
  end_timestamp: number;
  /** Epoch milliseconds when ANSWERED, or null (inbound / older calls). Ring time = answered_at - start_timestamp. */
  answered_at: number | null;
  /** TIME CONNECTED in ms (answer to hangup) - the number you are billed on. Ring time excluded, so on outbound this is NOT end_timestamp - start_timestamp. */
  duration_ms: number;
  /** Why the call ended: completed, transferred, voicemail_detected, silence_timeout,
   * ivr_timeout, max_duration_reached, caller_hangup (inbound), callee_hangup (outbound),
   * busy / failed / no-answer / canceled (carrier words for calls that never connected),
   * concurrency_limit, and rare infrastructure endings. */
  ended_reason: string;
  /** Minutes actually charged for this call. Transfers stop the meter at handoff, so
   * this can be less than duration_ms suggests - the recording runs to the end either way. */
  charged_minutes?: number;
  /** A single string, one turn per line - not an array of turn objects. */
  transcript: string;
  call_summary: string;
  caller_sentiment: CallerSentiment;
  call_successful: boolean;
  /** Fields pulled from the call, per the agent's extraction settings. */
  extracted_data: Record<string, unknown>;
  /** Appointments booked during the call. */
  bookings: unknown[];
  /** MP3 link, or null if recording was off. This is the ONLY copy - the carrier's copy is deleted. */
  recording_url: string | null;
  recording_duration_s?: number;
  voicemail_detected: boolean;
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
  /** The call purpose - what to say and why. Sent fresh per call, stored nowhere. Must not be empty. */
  prompt: string;
  /** Key-values interpolated into the prompt as {key}. Unmatched references stay literal - check your keys. */
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
  /** Whether a recording file was found and removed from storage. */
  recording_deleted: boolean;
}

export interface CallDeleteAllResponse {
  deleted: boolean;
  calls_deleted: number;
  recordings_deleted: number;
  sms_deleted: number;
}
