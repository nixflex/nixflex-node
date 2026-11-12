// ============================================
// src/resources/calls.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type { Call, OutboundCallParams, OutboundCallResponse, CallDeleteResponse, CallDeleteAllResponse } from '../types/calls.js';
import type { ListParams } from '../types/agents.js';
import type { CallHistoryParams, CallHistoryPage, CallRead, CallRecording, CallBilling } from '../types/call-reads.js';
import { prepareOutboundCall, createOutboundRequest, readCallBookings, readOutboundRequest } from '../call-requests.js';
import type { OutboundRequestReceipt } from '../types/call-requests.js';
import { contentDeleteId } from '../content-delete.js';

export class Calls {
  constructor(private readonly http: HttpClient) {}
  /** Generate a UUID locally before sending; save and reuse the returned body unchanged. */
  prepare(params: OutboundCallParams) { return prepareOutboundCall(params); }
  bookings(callId: string, opts?: RequestOptions) { return readCallBookings(this.http,callId,opts); }
  outboundRequest(requestId: string, opts?: RequestOptions) { return readOutboundRequest(this.http,requestId,opts); }

  /** Trigger an outbound AI call. FIRE-AND-FORGET: returns immediately with a
   * call_id; ringing, conversation and ending happen asynchronously. Set a
   * webhook_url on the agent or number to receive call.completed when it ends.
   * The dialling number must be OUTBOUND-ENABLED (inbound working does not
   * mean outbound works - separate switches). */
  create(params: OutboundCallParams & {request_id: string}, opts?: RequestOptions): Promise<OutboundRequestReceipt>;
  create(params: OutboundCallParams & {request_id?: undefined}, opts?: RequestOptions): Promise<OutboundCallResponse>;
  create(params: OutboundCallParams, opts?: RequestOptions): Promise<OutboundCallResponse | OutboundRequestReceipt>;
  create(params: OutboundCallParams, opts?: RequestOptions): Promise<OutboundCallResponse | OutboundRequestReceipt> {
    if (params.request_id !== undefined) return createOutboundRequest(this.http,params,opts);
    return this.http.request<OutboundCallResponse>('POST', '/calls/outbound', params, undefined, opts);
  }

  /** List calls, newest first. Default 50, hard cap 200. The response is a
   * bare array with no total - page until you get fewer rows than you asked
   * for within the 200 cap (or use iter()). Availability depends on retention. */
  list(params: ListParams = {}, opts?: RequestOptions): Promise<Call[]> {
    if ('agent_id' in params) throw new TypeError('Legacy calls.list does not filter by agent; use calls.history({agent: id}).');
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

  /** Managed-storage link: use expires_at, never a hardcoded lifetime, or a truthful non-downloadable state. Never reads BYO storage. */
  recording(callId: string, opts?: RequestOptions): Promise<CallRecording> {
    return this.http.request('GET', `/calls/${encodeURIComponent(callId)}/recording`, undefined, undefined, opts);
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

  /** End a running call, then delete its content. 503 hangup_pending with
   * retry_pending:true means queued, not deleted. Recording cleanup may remain
   * queued or carrier best effort. One DELETE; never automatically repeated. */
  delete(callId: string, opts?: RequestOptions): Promise<CallDeleteResponse> {
    return this.http.request<CallDeleteResponse>('DELETE', `/calls/${contentDeleteId(callId)}`, undefined, undefined, opts);
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
import type { BatchCampaignParams, BatchCreateResponse, BatchLaunchResponse, CampaignDeleteResponse } from '../types/calls.js';

import type * as C5 from '../types/campaign-controls.js';
export class Campaigns {
  /** Cancel waiting work, end running calls and hide the campaign. History and used
   * charges remain; no refund. Owner/Admin only. 503 hangup_pending is queued.
   * Missing/foreign is 404. One DELETE; never automatically repeated. */
  delete(id: string, opts?: RequestOptions): Promise<CampaignDeleteResponse> {
    return this.http.request('DELETE', `/calls/batch/${contentDeleteId(id)}`, undefined, undefined, opts);
  }
  cancel(id: string, opts?: RequestOptions): Promise<C5.CampaignCancelResponse> {
    return this.http.request('POST', `/calls/batch/${encodeURIComponent(id)}/cancel`, undefined, undefined, opts);
  }
  consent(id: string, params: C5.CampaignConsentParams, opts?: RequestOptions): Promise<C5.CampaignConsentResponse> {
    return this.http.request('POST', `/calls/batch/${encodeURIComponent(id)}/consent`, params, undefined, opts);
  }
  resume(id: string, opts?: RequestOptions): Promise<C5.CampaignResumeResponse> {
    return this.http.request('POST', `/calls/batch/${encodeURIComponent(id)}/resume`, undefined, undefined, opts);
  }
  list(params: C5.CampaignListQuery = {}, opts?: RequestOptions): Promise<C5.CampaignListResponse> {
    return this.http.request('GET', '/campaigns', undefined, { ...params }, opts);
  }

  constructor(private readonly http: HttpClient) {}

  /** Create executable work, not a draft. The default requests immediate launch; scheduled work can start automatically. Each dispatch still checks consent and local hours. */
  create(params: BatchCampaignParams, opts?: RequestOptions): Promise<BatchCreateResponse> {
    return this.http.request<BatchCreateResponse>('POST', '/calls/batch', params, undefined, opts);
  }

  /** Request launch; it does not bypass recipient checks or prove delivery. Never auto-retried. */
  launch(campaignId: string, opts?: RequestOptions): Promise<BatchLaunchResponse> {
    return this.http.request<BatchLaunchResponse>('POST', `/calls/batch/${encodeURIComponent(campaignId)}/launch`, undefined, undefined, opts);
  }
}
