/** Explicit decisions only. Omission never grants consent or wider calling hours. */
export interface CampaignPolicy {
  consent_confirmed?: boolean;
  duplicate_policy?: 'allow' | 'warn' | 'reject';
  allow_wider_hours?: boolean;
  /** Required with wider hours: 20..1000 characters describing the approval. */
  hours_confirmation?: string;
  skip_invalid?: boolean;
  source?: string;
  reuse_campaign_id?: string;
  reply_window_hours?: number;
}
export interface RecipientLocation { country?: string; timezone?: string; }
export interface ContactLocation { recipient_country?: string; recipient_timezone?: string; }
export interface CampaignValidation {
  duplicates?: unknown;
  missing_details?: unknown;
  validation?: unknown;
}
