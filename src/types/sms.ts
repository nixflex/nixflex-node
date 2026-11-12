import type { CampaignPolicy, CampaignValidation, RecipientLocation, ContactLocation } from './campaign-policy.js';
import type { Weekday, BatchInvalidEntry } from './calls.js';

/** SMS uses `to`, not the outbound-call field `to_number`. */
export interface SmsSendParams extends ContactLocation {
  agent_id: string;
  to: string;
  message: string;
  /** Required imported sender; no agent-number fallback. */
  from_number: string;
  context?: { reply_context?: string | null; [key: string]: unknown };
}
export interface SmsSendResponse {
  status: string; to: string; from: string;
  message_id?: string | null; work_id?: string | null; persistence?: string; safe_to_retry?: false;
}
export interface SmsCampaignRecipient extends RecipientLocation {
  phone: string;
  /** Missing referenced values may refuse creation or dispatch. */
  variables?: Record<string, unknown>;
}
export interface SmsCampaignCreateParams extends Omit<CampaignPolicy, 'reuse_campaign_id'> {
  agent_id: string; from_number: string; name?: string;
  message_template: string;
  recipients: SmsCampaignRecipient[];
  schedule_type?: 'now' | 'schedule'; scheduled_date?: string | null;
  window_start_minutes?: number | null; window_end_minutes?: number | null;
  window_days?: Weekday[] | null; timezone?: string | null; reply_context_prompt?: string | null;
}
export type SmsCampaignStatus = 'draft' | 'scheduled' | 'launching' | 'running' | 'paused' | 'done' | 'failed' | 'cancelled';
export interface SmsCampaign {
  campaign_id: string; agent_id: string; name: string | null; status: string;
  from_number?: string | null; message_template?: string;
  id?: string; api_key_id?: string; schedule_type?: string; timezone?: string | null;
  window_start_minutes?: number | null; window_end_minutes?: number | null; window_days?: Weekday[] | null;
  started_at?: string | null; completed_at?: string | null; updated_at?: string | null; claimed_at?: string | null;
  allow_wider_hours?: boolean; reply_count?: number; total_segments?: number;
  total_count: number; delivered_count: number; failed_count: number; pending_count: number;
  /** Handed to carrier; distinct from delivered and failed. */
  sent_count?: number; undelivered_count?: number; segments_count?: number; segments_estimated?: boolean;
  source?: string; scheduled_date?: string | null; created_at: string | null;
  is_active?: boolean; reply_context_prompt?: string | null; reply_window_hours?: number;
}
export interface SmsCampaignCreateResponse extends CampaignValidation, SmsCampaignLaunchResponse {
  campaign_id: string; status: string; valid_count?: number; invalid_count?: number;
  invalid?: BatchInvalidEntry[]; total_count?: number; message?: string;
}
export interface SmsCampaignDetailParams {
  limit?: number; recipient_cursor?: string; message_cursor?: string;
}
export interface SmsCampaignRecipientRecord {
  id: string; phone_number: string; status: string;
  variables?: Record<string, unknown>; rendered_message?: string | null;
  sent_at?: string | null; delivered_at?: string | null; error_message?: string | null;
  country?: string | null; timezone?: string | null;
  [field: string]: unknown;
}
export interface SmsCampaignDetail {
  campaign: SmsCampaign; recipients: SmsCampaignRecipientRecord[];
  messages: Array<Record<string, unknown>>;
  pagination: { recipient_cursor: string | null; message_cursor: string | null; limit: number; paged: boolean };
}
export interface SmsCampaignListResponse { campaigns: SmsCampaign[]; next_cursor?: string | null; }
/** Launch acknowledgement; delivery remains asynchronous and policy-gated. */
export interface SmsCampaignLaunchResponse {
  campaign_id?: string; status: string | null; sent?: number; failed?: number; total_segments?: number;
  held?: number; reason?: string; stopped?: boolean; stop_reason?: string; not_sent?: number;
  safe_to_retry?: false; message?: string;
}
/** Legacy receipt construction remains source-compatible. The delete method returns
 * the complete B57 CampaignDeleteResponse with required campaign_id/deleted fields. */
export interface SmsCampaignDeleteResponse {
  message: string;
  campaign_id?: string;
  deleted?: true;
}
