// ============================================
// src/resources/calls.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type { Call, OutboundCallParams, OutboundCallResponse, CallDeleteResponse, CallDeleteAllResponse } from '../types/calls.js';
import type { ListParams } from '../types/agents.js';
import type { CallHistoryParams, CallHistoryPage, CallRead, CallRecording, CallBilling } from '../types/call-reads.js';

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
   * for within the 200 cap (or use iter()). Availability depends on retention. */
  list(params: ListParams = {}, opts?: RequestOptions): Promise<Call[]> {
    return this.http.request<Call[]>('GET', '/calls', undefined, { limit: params.limit, offset: params.offset }, opts);
  }

  /** Dashboard-style filtered metadata, totals and stable cursor order. Not a frozen database snapshot. */
  history(params: CallHistoryParams = {}, opts?: RequestOptions): Promise<CallHistoryPage> {
    return this.http.request('GET', '/calls/history', undefined, { ...params }, opts);
  }

  /** Explicit nullable detail, failed-start and retained stubs; no raw storage URL. */
  read(callId: string, opts?: RequestOptions): Promise<CallRead> {
    return this.http.request('GET', `/calls/${encodeURIComponent(callId)}`, undefined, { view: 'detail' }, opts);
  }

  /** Five-minute managed-storage link, or a truthful non-downloadable state. Never reads BYO storage. */
  recording(callId: string, opts?: RequestOptions): Promise<CallRecording> {
    return this.http.request('GET', `/calls/${encodeURIComponent(callId)}/recording`, undefined, undefined, opts);
  }

  /** Existing settled proof only. Unknown is null, not a zero charge. */
  billing(callId: string, opts?: RequestOptions): Promise<CallBilling> {
    return this.http.request('GET', `/calls/${encodeURIComponent(callId)}/billing`, undefined, undefined, opts);
  }

  /** Iterate calls across pages. pageSize must be a whole number 1..200.
   * Offset pages are not a snapshot: concurrent changes can shift rows. */
  async *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Call> {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) throw new RangeError('Call pageSize must be a whole number from 1 to 200.');
    let offset = 0;
    while (true) {
      const page = await this.list({ limit: pageSize, offset }, opts);
      for (const item of page) yield item;
      if (page.length < pageSize) return;
      offset += page.length;
    }
  }

  /** Fetch one call: transcript, recording URL, post-call analysis. Note:
   * duration_ms is time CONNECTED (not necessarily AI billed time) - ring time is
   * excluded, so it will not equal end_timestamp - start_timestamp on
   * outbound calls. */
  get(callId: string, opts?: RequestOptions): Promise<Call> {
    return this.http.request<Call>('GET', `/calls/${encodeURIComponent(callId)}`, undefined, undefined, opts);
  }

  /** Request guarded call deletion; active/unsettled work and cleanup safety
   * holds can refuse it. Not proof of every copy's erasure. Never auto-retried. */
  delete(callId: string, opts?: RequestOptions): Promise<CallDeleteResponse> {
    return this.http.request<CallDeleteResponse>('DELETE', `/calls/${encodeURIComponent(callId)}`, undefined, undefined, opts);
  }

  /** Request guarded call cleanup, not account/SMS erasure. Safety holds can
   * refuse it; legacy recording counters are not proof of every copy's erasure. */
  deleteAll(opts?: RequestOptions): Promise<CallDeleteAllResponse> {
    return this.http.request<CallDeleteAllResponse>('DELETE', '/calls', undefined, undefined, opts);
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
