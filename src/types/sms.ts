// ============================================
// src/types/sms.ts
// From docs.nixflex.com/api-reference/sms/* (Aug 2026).
// ============================================

/** NOTE: this endpoint uses `to` (NOT to_number - that is the outbound-call
 * field). Sending to_number here fails with a missing-field error. */
export interface SmsSendParams {
  /** Agent that owns this SMS - its prompt handles any replies. */
  agent_id: string;
  /** Recipient, E.164. This endpoint uses `to`, not `to_number`. */
  to: string;
  /** Message text. 600 chars recommended for reliable delivery (carrier hard caps ~1600). */
  message: string;
  /** Which imported number to send from (either carrier). Omit = the agent's own number. */
  from_number?: string;
  /** Optional reply context: { reply_context: "..." } gives the agent background for replies to this message. */
  context?: { reply_context?: string };
}

export interface SmsSendResponse {
  status: string;
  to: string;
  from: string;
}

export interface SmsCampaignRecipient {
  phone: string;
  /** Fills {{placeholders}} in the template. Missing variables render as empty strings. */
  variables?: Record<string, string>;
}

/** from_number may be on EITHER carrier (Twilio or Telnyx) - the campaign
 * sends using that number's own credentials, so it must be a number on your
 * account. (An earlier doc page wrongly said Telnyx was rejected at create;
 * the engine routes by provider and has done since the Twilio-only lookup
 * was removed.) */
export interface SmsCampaignCreateParams {
  agent_id: string;
  /** Your imported TWILIO number. */
  from_number: string;
  /** Display name in the dashboard. */
  name: string;
  /** Message text with {{variable}} placeholders. */
  message_template: string;
  /** Up to 10,000. */
  recipients: SmsCampaignRecipient[];
  schedule_type: 'now' | 'schedule';
  /** ISO date - required when schedule_type is 'schedule'. */
  scheduled_at?: string;
}

export type SmsCampaignStatus = 'draft' | 'scheduled' | 'running' | 'done' | 'failed';

export interface SmsCampaign {
  campaign_id: string;
  agent_id: string;
  name: string;
  from_number?: string;
  message_template?: string;
  status: SmsCampaignStatus;
  total_count: number;
  /** Carrier-confirmed handset delivery. Note: Twilio 'sent' (handed to carrier,
   * never confirmed) is counted as FAILED, not delivered. */
  delivered_count: number;
  failed_count: number;
  pending_count: number;
  source?: string;
  scheduled_at?: string | null;
  created_at: string;
  recipients?: Array<{
    phone: string;
    variables?: Record<string, string>;
    status: 'pending' | 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed';
    twilio_sid?: string;
    rendered_message?: string;
    error_message?: string;
    sent_at?: string;
  }>;
}

export interface SmsCampaignListResponse {
  campaigns: SmsCampaign[];
}

export interface SmsCampaignLaunchResponse {
  campaign_id: string;
  status: string;
  total_count: number;
  pending_count: number;
  delivered_count: number;
  failed_count: number;
}

export interface SmsCampaignDeleteResponse {
  campaign_id: string;
  deleted: boolean;
  /** Pending recipients that will NOT be messaged. Already-sent messages cannot be recalled. */
  cancelled_count: number;
}
