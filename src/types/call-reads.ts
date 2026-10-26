/** Optional, read-only history view. Legacy calls.list() still returns an array. */
export interface CallHistoryParams {
  limit?: number; offset?: number; cursor?: string;
  agent?: string; number?: string;
  direction?: 'all' | 'inbound' | 'outbound' | 'web';
  outcome?: 'all' | 'successful' | 'unsuccessful' | 'unknown' | 'failed';
  source?: 'all' | 'campaign' | 'web' | 'test' | 'other';
  /** today uses UTC; pass explicit since/until to match a browser's local dates. */
  period?: 'all' | 'today' | 'week' | 'month';
  since?: string; until?: string; search?: string;
}
export interface CallRead {
  call_id: string; id?: string; agent_id: string | null;
  from_number?: string | null; to_number?: string | null;
  call_type: 'inbound' | 'outbound' | 'web' | null;
  call_direction: 'inbound' | 'outbound' | 'web' | null;
  call_status?: string | null; duration_ms: number | null;
  start_timestamp: number | null; end_timestamp?: number | null;
  answered_at?: number | null; created_at: string | null;
  ended_reason: string | null; call_successful: boolean | null;
  caller_sentiment?: string | null; cost: number | null; charged_minutes?: number | null;
  campaign_id?: string | null; test_requested_by?: string | null;
  call_summary?: string | null; transcript?: string | null;
  extracted_data?: Record<string, unknown> | null; call_events?: unknown[] | null;
  recording_url?: null; recording_status?: RecordingStatus;
  payload_deleted_at?: string | null; payload_deleted_reason?: string | null;
  payload_scheduled_for_deletion?: boolean; payload_in_own_storage?: boolean | null;
}
export interface CallHistoryPage {
  data: CallRead[];
  totals: { total: number; minutes: number; cost: number; cost_unknown: number; successful: number };
  filters: Record<string, string | null>; limit: number; offset: number;
  has_more: boolean; next_cursor: string | null;
}
export type RecordingStatus = 'available' | 'pending' | 'expired' | 'customer_bucket' | 'not_recorded' | 'unknown' | 'unavailable' | 'pending_deletion';
export interface CallRecording { call_id: string; status: RecordingStatus; url: string | null; expires_at: string | null }
export interface CallBilling {
  call_id: string; status: 'settled' | 'pending' | 'unknown' | 'not_started'; currency: 'USD';
  cost: number | null; recorded_cost?: number | null; charged_minutes: number | null;
  ai_billed_ms: number | null; human_free_ms: number | null;
  /** conservative is a protective billing cap, NOT proof of exact human handover time. */
  basis: 'fenced' | 'conservative' | 'settled_no_takeover' | 'not_started' | null;
}
