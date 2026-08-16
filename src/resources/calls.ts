// ============================================
// src/resources/calls.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type { Call, OutboundCallParams, OutboundCallResponse } from '../types/calls.js';
import type { ListParams } from '../types/agents.js';

export class Calls {
  constructor(private readonly http: HttpClient) {}

  /** Trigger an outbound AI call. FIRE-AND-FORGET: returns immediately with a
   * call_id; ringing, conversation and ending happen asynchronously. Set a
   * webhook_url on the agent or number to receive call.completed when it ends.
   * The dialling number must be OUTBOUND-ENABLED (inbound working does not
   * mean outbound works - separate switches). */
  create(params: OutboundCallParams, opts?: RequestOptions): Promise<OutboundCallResponse> {
    return this.http.request<OutboundCallResponse>('POST', '/calls/outbound', params, undefined, opts);
  }

  /** List calls, newest first. Default 50, hard cap 200. The response is a
   * bare array with no total - page until you get fewer rows than you asked
   * for (or use iter()). Call data is retained 90 days. */
  list(params: ListParams = {}, opts?: RequestOptions): Promise<Call[]> {
    return this.http.request<Call[]>('GET', '/calls', undefined, { limit: params.limit, offset: params.offset }, opts);
  }

  /** Iterate ALL calls across pages: `for await (const c of client.calls.iter()) { ... }` */
  async *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Call> {
    let offset = 0;
    while (true) {
      const page = await this.list({ limit: pageSize, offset }, opts);
      for (const item of page) yield item;
      if (page.length < pageSize) return;
      offset += page.length;
    }
  }

  /** Fetch one call: transcript, recording URL, post-call analysis. Note:
   * duration_ms is time CONNECTED (what you are billed on) - ring time is
   * excluded, so it will not equal end_timestamp - start_timestamp on
   * outbound calls. */
  get(callId: string, opts?: RequestOptions): Promise<Call> {
    return this.http.request<Call>('GET', `/calls/${encodeURIComponent(callId)}`, undefined, undefined, opts);
  }
}

// ============================================
// Voice batch campaigns (POST /calls/batch)
// ============================================
import type { BatchCampaignParams, BatchCreateResponse, BatchLaunchResponse } from '../types/calls.js';

export class Campaigns {
  constructor(private readonly http: HttpClient) {}

  /** Create a batch campaign - many outbound calls under one campaign_id.
   * schedule_type 'now' launches immediately; 'schedule' waits for
   * scheduled_date and fires INSIDE the calling window in the campaign's
   * timezone (yours > the agent's > Europe/London). Overnight windows
   * supported. One campaign = one timezone - split multi-country lists. */
  create(params: BatchCampaignParams, opts?: RequestOptions): Promise<BatchCreateResponse> {
    return this.http.request<BatchCreateResponse>('POST', '/calls/batch', params, undefined, opts);
  }

  /** Launch a scheduled campaign immediately, overriding its schedule.
   * Already running = no-op returning current status. */
  launch(campaignId: string, opts?: RequestOptions): Promise<BatchLaunchResponse> {
    return this.http.request<BatchLaunchResponse>('POST', `/calls/batch/${encodeURIComponent(campaignId)}/launch`, undefined, undefined, opts);
  }
}
