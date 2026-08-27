// ============================================
// src/resources/phone-numbers.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type {
  PhoneNumber, PhoneNumberImportParams, PhoneNumberUpdateParams,
  PhoneNumberListResponse, PhoneNumberDeleteResponse,
  MonitorToggleResponse, WebCallsToggleResponse,
} from '../types/phone-numbers.js';

/** E.164 numbers go in URL paths - the + MUST be encoded or routing breaks. */
function enc(phoneNumber: string): string {
  return encodeURIComponent(phoneNumber);
}

export class PhoneNumbers {
  constructor(private readonly http: HttpClient) {}

  /** Attach a number you already own. Carrier inferred from credentials
   * (twilio_sid+twilio_token OR telnyx_api_key+telnyx_connection_id).
   * WARNING: Twilio import REPLACES the number's existing webhooks - another
   * system using this number stops receiving calls and SMS. */
  import(params: PhoneNumberImportParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }> {
    return this.http.request('POST', '/phone-numbers', params, undefined, opts);
  }

  /** All numbers on your account (optionally one agent's), newest first.
   * Not paginated - returns up to 1,000; filter by agent_id above that. */
  list(params: { agent_id?: string } = {}, opts?: RequestOptions): Promise<PhoneNumberListResponse> {
    return this.http.request('GET', '/phone-numbers', undefined, { agent_id: params.agent_id }, opts);
  }

  /** Update per-number settings. Send ONLY what changes (empty body is
   * rejected). null clears/inherits - see each field's JSDoc; speaking_rate
   * null INHERITS the agent's speed (send 1, not null, to force normal). */
  update(phoneNumber: string, params: PhoneNumberUpdateParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }> {
    return this.http.request('PATCH', `/phone-numbers/${enc(phoneNumber)}`, params, undefined, opts);
  }

  /** Disconnect from Nixflex (clears carrier webhooks + our record). Does NOT
   * release the number from your carrier - carrier billing continues until
   * you release it in Twilio/Telnyx yourself. Reversible by re-importing. */
  delete(phoneNumber: string, opts?: RequestOptions): Promise<PhoneNumberDeleteResponse> {
    return this.http.request('DELETE', `/phone-numbers/${enc(phoneNumber)}`, undefined, undefined, opts);
  }

  /** Turn live call monitoring on/off for a number (off by default).
   * NOTE: enabling bills that number's inbound calls at $0.09/min. */
  setMonitor(phoneNumber: string, enabled: boolean, opts?: RequestOptions): Promise<MonitorToggleResponse> {
    return this.http.request('PUT', `/integrations/monitor/number/${enc(phoneNumber)}`, { enabled }, undefined, opts);
  }

  /** Current monitoring state for a number. */
  getMonitor(phoneNumber: string, opts?: RequestOptions): Promise<MonitorToggleResponse> {
    return this.http.request('GET', `/integrations/monitor/number/${enc(phoneNumber)}`, undefined, undefined, opts);
  }

  /** Enable/disable browser (web) calls for a number (off by default).
   * NOTE: enabling bills that number's calls at $0.09/min (same rule as
   * Live Monitor - either on means 0.09, both on is still 0.09). */
  setWebCalls(phoneNumber: string, enabled: boolean, opts?: RequestOptions): Promise<WebCallsToggleResponse> {
    return this.http.request('PUT', `/integrations/web-calls/number/${enc(phoneNumber)}`, { enabled }, undefined, opts);
  }

  /** Current web-calls state for a number. */
  getWebCalls(phoneNumber: string, opts?: RequestOptions): Promise<WebCallsToggleResponse> {
    return this.http.request('GET', `/integrations/web-calls/number/${enc(phoneNumber)}`, undefined, undefined, opts);
  }
}

// ============================================
// SMS + campaigns
// ============================================
import type {
  SmsSendParams, SmsSendResponse, SmsCampaignCreateParams, SmsCampaign,
  SmsCampaignListResponse, SmsCampaignLaunchResponse, SmsCampaignDeleteResponse,
  SmsCampaignStatus,
} from '../types/sms.js';

export class SmsCampaigns {
  constructor(private readonly http: HttpClient) {}

  /** Create a one-time SMS broadcast ({{variable}} templating per recipient,
   * up to 10,000 recipients). from_number may be on either carrier (Twilio or
   * Telnyx) and must be a number on your own account. */
  create(params: SmsCampaignCreateParams, opts?: RequestOptions): Promise<SmsCampaign> {
    return this.http.request('POST', '/sms/campaigns', params, undefined, opts);
  }

  /** Launch a draft/scheduled campaign immediately. */
  launch(campaignId: string, opts?: RequestOptions): Promise<SmsCampaignLaunchResponse> {
    return this.http.request('POST', `/sms/campaigns/${encodeURIComponent(campaignId)}/launch`, undefined, undefined, opts);
  }

  /** All campaigns, newest first, with live-computed delivery counts. */
  list(params: { status?: SmsCampaignStatus; limit?: number } = {}, opts?: RequestOptions): Promise<SmsCampaignListResponse> {
    return this.http.request('GET', '/sms/campaigns', undefined, { status: params.status, limit: params.limit }, opts);
  }

  /** One campaign with per-recipient statuses. Twilio 'sent' (handed to
   * carrier, never confirmed on the handset) counts as FAILED, not delivered. */
  get(campaignId: string, opts?: RequestOptions): Promise<SmsCampaign> {
    return this.http.request('GET', `/sms/campaigns/${encodeURIComponent(campaignId)}`, undefined, undefined, opts);
  }

  /** Cancel a scheduled/running campaign. Already-sent messages cannot be
   * recalled; cancelled_count = pending recipients that will not be messaged. */
  delete(campaignId: string, opts?: RequestOptions): Promise<SmsCampaignDeleteResponse> {
    return this.http.request('DELETE', `/sms/campaigns/${encodeURIComponent(campaignId)}`, undefined, undefined, opts);
  }
}

export class Sms {
  /** SMS campaigns - one-time bulk broadcasts. */
  readonly campaigns: SmsCampaigns;

  constructor(private readonly http: HttpClient) {
    this.campaigns = new SmsCampaigns(http);
  }

  /** Send a single SMS from one of your numbers (both carriers). NOTE: this
   * endpoint uses `to` - NOT to_number (that is the outbound-call field).
   * Replies are answered automatically by the agent's prompt. */
  send(params: SmsSendParams, opts?: RequestOptions): Promise<SmsSendResponse> {
    return this.http.request('POST', '/sms', params, undefined, opts);
  }
}

// ============================================
// Keys + usage
// ============================================
import type { KeyRotateResponse, Usage } from '../types/account.js';

export class Keys {
  constructor(private readonly http: HttpClient) {}

  /** Rotate the key SECRET (key_id stays stable - the Stripe model). The old
   * secret stops working THE INSTANT this returns; the new one is shown ONCE.
   * Update every deployed app before rotating in production. */
  rotate(opts?: RequestOptions): Promise<KeyRotateResponse> {
    return this.http.request('POST', '/keys/rotate', undefined, undefined, opts);
  }
}

export class UsageResource {
  constructor(private readonly http: HttpClient) {}

  /** Usage + balance: calls, minutes, SMS, credit. minutes is fractional;
   * cost_usd excludes carrier charges (Twilio/Telnyx bill you directly). */
  get(opts?: RequestOptions): Promise<Usage> {
    return this.http.request('GET', '/usage', undefined, undefined, opts);
  }
}

// ============================================
// Your own recording storage (BYO storage)
// ============================================
import type { StorageConfig, StorageSetParams, StorageSetResponse, StorageDeleteResponse } from '../types/account.js';
export class Storage {
  constructor(private readonly http: HttpClient) {}
  /** Connect your own S3-compatible bucket for call recordings (data residency).
   * The connection is verified with a probe write BEFORE saving - broken
   * credentials are rejected, never stored. Recordings then upload to your
   * bucket and Nixflex keeps no copy; recording_url becomes a byo: path. */
  set(params: StorageSetParams, opts?: RequestOptions): Promise<StorageSetResponse> {
    return this.http.request('PUT', '/account/storage', params, undefined, opts);
  }
  /** Current storage configuration. The secret is never included. */
  get(opts?: RequestOptions): Promise<StorageConfig> {
    return this.http.request('GET', '/account/storage', undefined, undefined, opts);
  }
  /** Disconnect and clear. Recordings return to Nixflex EU storage from the
   * next call; files already in your bucket are untouched - they are yours. */
  delete(opts?: RequestOptions): Promise<StorageDeleteResponse> {
    return this.http.request('DELETE', '/account/storage', undefined, undefined, opts);
  }
}
// ============================================
// Per-number webhook integration
// ============================================
import type { WebhookConfigResponse } from '../types/account.js';
import { verifyWebhookSignature } from '../webhook-verify.js';

export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  /** Verify a webhook delivery's X-Nixflex-Signature header. Pass the RAW
   * request body (string or Buffer) and your key_secret. Returns true only
   * for an authentic, fresh signature. See webhook-verify.ts. */
  verify(rawBody: string | Buffer, signatureHeader: string | null | undefined, keySecret: string, options?: import('../webhook-verify.js').VerifyOptions): boolean {
    return verifyWebhookSignature(rawBody, signatureHeader, keySecret, options);
  }

  /** Point a number's post-call events at your HTTPS endpoint.
   * slot 2 = the second destination (webhook2). */
  set(phoneNumber: string, url: string, slot: 1 | 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> {
    const base = slot === 2 ? 'webhook2' : 'webhook';
    return this.http.request('PUT', `/integrations/${base}/number/${encodeURIComponent(phoneNumber)}`, { url }, undefined, opts);
  }

  /** Read the webhook configured on a number. */
  get(phoneNumber: string, slot: 1 | 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> {
    const base = slot === 2 ? 'webhook2' : 'webhook';
    return this.http.request('GET', `/integrations/${base}/number/${encodeURIComponent(phoneNumber)}`, undefined, undefined, opts);
  }

  /** Remove the webhook from a number. */
  delete(phoneNumber: string, slot: 1 | 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> {
    const base = slot === 2 ? 'webhook2' : 'webhook';
    return this.http.request('DELETE', `/integrations/${base}/number/${encodeURIComponent(phoneNumber)}`, undefined, undefined, opts);
  }
}
