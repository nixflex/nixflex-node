// ============================================
// src/resources/phone-numbers.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import { smsCampaignInput } from '../sms-campaign-input.js';
import { readNumberUsage } from './number-usage.js';
import { moveNumber, type PhoneNumberMoveParams, type PhoneNumberMoveResponse } from './number-move.js';
import type { NumberUsageParams, NumberUsageResponse } from '../types/number-usage.js';
import type {
  PhoneNumber, PhoneNumberImportParams, PhoneNumberUpdateParams,
  PhoneNumberListResponse, PhoneNumberListParams, PhoneNumberDetails, PhoneNumberDeleteResponse,
  MonitorToggleResponse, WebCallsToggleResponse,
} from '../types/phone-numbers.js';

/** E.164 numbers go in URL paths - the + MUST be encoded or routing breaks. */
function enc(phoneNumber: string): string {
  return encodeURIComponent(phoneNumber);
}

export class PhoneNumbers {
  constructor(private readonly http: HttpClient) {}

  /** Retained-history usage, not a billing ledger. Defaults: all, UTC. */
  usage(phoneNumber: string, params: NumberUsageParams = {}, opts?: RequestOptions): Promise<NumberUsageResponse> {
    return readNumberUsage(this.http, phoneNumber, params, opts);
  }

  /** Attach a number you already own. Carrier inferred from credentials
   * (twilio_sid+twilio_token OR telnyx_api_key+telnyx_connection_id).
   * WARNING: Twilio import REPLACES the number's existing webhooks - another
   * system using this number stops receiving calls and SMS. */
  import(params: PhoneNumberImportParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }> {
    return this.http.request('POST', '/phone-numbers', params, undefined, opts);
  }

  /** Owned public numbers, newest first. Opt into paging with limit/cursor.
   * count is returned rows. Without paging, the server's row cap still applies. */
  list(params: PhoneNumberListParams = {}, opts?: RequestOptions): Promise<PhoneNumberListResponse> {
    return this.http.request('GET', '/phone-numbers', undefined, { agent_id: params.agent_id, provider: params.provider, limit: params.limit, cursor: params.cursor }, opts);
  }

  /** Saved safe settings, effective website voice switch, and safe key status. */
  get(phoneNumber: string, opts?: RequestOptions): Promise<{ phone_number: PhoneNumberDetails }> {
    return this.http.request('GET', `/phone-numbers/${enc(phoneNumber)}`, undefined, undefined, opts);
  }

  /** Update per-number settings. Send ONLY what changes (empty body is
   * rejected). null clears/inherits - see each field's JSDoc; speaking_rate
   * null INHERITS the agent's speed (send 1, not null, to force normal). */
  update(phoneNumber: string, params: PhoneNumberMoveParams, opts?: RequestOptions): Promise<PhoneNumberMoveResponse>;
  update(phoneNumber: string, params: PhoneNumberUpdateParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }>;
  update(phoneNumber: string, params: PhoneNumberUpdateParams | PhoneNumberMoveParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber } | PhoneNumberMoveResponse> {
    if ('agent_id' in params) return moveNumber(this.http, phoneNumber, params, opts);
    return this.http.request('PATCH', `/phone-numbers/${enc(phoneNumber)}`, params, undefined, opts);
  }

  /** Same-account move; busy work is refused. Own number settings and history stay. */
  move(phoneNumber: string, agentId: string, opts?: RequestOptions): Promise<PhoneNumberMoveResponse> {
    return moveNumber(this.http, phoneNumber, { agent_id: agentId }, opts);
  }

  /** Disconnect from Nixflex (clears carrier webhooks + our record). Does NOT
   * release the number from your carrier - carrier billing continues until
   * you release it in Twilio/Telnyx yourself. Reversible by re-importing. */
  delete(phoneNumber: string, opts?: RequestOptions): Promise<PhoneNumberDeleteResponse> {
    return this.http.request('DELETE', `/phone-numbers/${enc(phoneNumber)}`, undefined, undefined, opts);
  }

  /** Enable/disable browser (web) calls for a number (off by default).
   * Enabling alone is free. Premium applies to actual browser calls,
   * not ordinary phone calls just because this switch is enabled. */
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
  SmsCampaignStatus, SmsCampaignDetail, SmsCampaignDetailParams, SmsCampaignCreateResponse,
} from '../types/sms.js';

import type * as C5 from '../types/campaign-controls.js';
export class SmsCampaigns {
  cancel(id: string, opts?: RequestOptions): Promise<C5.CampaignCancelResponse> {
    return this.http.request('POST', `/sms/campaigns/${encodeURIComponent(id)}/cancel`, undefined, undefined, opts);
  }
  consent(id: string, params: C5.CampaignConsentParams, opts?: RequestOptions): Promise<C5.CampaignConsentResponse> {
    return this.http.request('POST', `/sms/campaigns/${encodeURIComponent(id)}/consent`, params, undefined, opts);
  }
  resume(id: string, opts?: RequestOptions): Promise<C5.CampaignResumeResponse> {
    return this.http.request('POST', `/sms/campaigns/${encodeURIComponent(id)}/resume`, undefined, undefined, opts);
  }
  update(id: string, params: C5.SmsCampaignUpdateParams, opts?: RequestOptions): Promise<C5.SmsCampaignUpdateResponse> {
    return this.http.request('PATCH', `/sms/campaigns/${encodeURIComponent(id)}`, params, undefined, opts);
  }

  constructor(private readonly http: HttpClient) {}

  /** Create a one-time SMS broadcast ({{variable}} templating per recipient,
   * up to 100,000 recipients). from_number may be on either carrier (Twilio or
   * Telnyx) and must be a number on your own account. */
  create(params: SmsCampaignCreateParams, opts?: RequestOptions): Promise<SmsCampaignCreateResponse> {
    return this.http.request('POST', '/sms/campaigns', smsCampaignInput(params), undefined, opts);
  }

  /** Request launch; scheduling and recipient contact-hour gates still apply. */
  launch(campaignId: string, opts?: RequestOptions): Promise<SmsCampaignLaunchResponse> {
    return this.http.request('POST', `/sms/campaigns/${encodeURIComponent(campaignId)}/launch`, undefined, undefined, opts);
  }

  /** All campaigns, newest first, with live-computed delivery counts. */
  list(params: { status?: string; limit?: number; before?: string } = {}, opts?: RequestOptions): Promise<SmsCampaignListResponse> {
    return this.http.request('GET', '/sms/campaigns', undefined, { status: params.status, limit: params.limit, before: params.before }, opts);
  }

  /** Detail envelope with independent recipient/message cursors; sent is not failed. */
  get(campaignId: string, opts?: RequestOptions & SmsCampaignDetailParams): Promise<SmsCampaignDetail> {
    return this.http.request('GET', `/sms/campaigns/${encodeURIComponent(campaignId)}`, undefined,
      { limit: opts?.limit, recipient_cursor: opts?.recipient_cursor, message_cursor: opts?.message_cursor }, opts);
  }

  /** Delete an inactive/finished campaign. Active campaigns are refused; this never cancels or recalls sends. */
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
import type { KeyActivityParams, KeyActivity } from '../types/core.js';

export class Keys {
  constructor(private readonly http: HttpClient) {}

  /** Retained request-log snapshot, not organisation audit events. Default today (UTC). */
  activity(params: KeyActivityParams = {}, opts?: RequestOptions): Promise<KeyActivity> {
    return this.http.request('GET', '/keys/activity', undefined, { ...params }, opts);
  }

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
// Per-number webhook integration
// ============================================
import type { WebhookConfigResponse } from '../types/account.js';
import { verifyWebhookSignature } from '../webhook-verify.js';

export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  /** Verify a webhook delivery's X-Nixflex-Signature header. Pass the RAW
   * request body (string or Buffer) and the organisation signing secret (independent of API-key rotation). Returns true only
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
