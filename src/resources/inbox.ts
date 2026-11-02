import type { HttpClient, RequestOptions } from '../client.js';
import type * as C from '../types/inbox.js';
export class Inbox {
  constructor(private readonly http: HttpClient) {}
  list(channel: 'sms' | 'web', number: string, params: C.InboxListQuery = {}, opts?: RequestOptions): Promise<C.InboxListResponse> {
    return this.http.request('GET', `/agent-inbox/${encodeURIComponent(channel)}/${encodeURIComponent(number)}`, undefined, { ...params }, opts);
  }
  thread(channel: 'sms' | 'web', number: string, thread: string, params: C.InboxThreadQuery = {}, opts?: RequestOptions): Promise<C.InboxThreadResponse> {
    return this.http.request('GET', `/agent-inbox/${encodeURIComponent(channel)}/${encodeURIComponent(number)}/thread/${encodeURIComponent(thread)}`, undefined, { ...params }, opts);
  }
  update(channel: 'sms' | 'web', number: string, thread: string, params: C.InboxUpdateParams, opts?: RequestOptions): Promise<C.InboxUpdateResponse> {
    return this.http.request('PATCH', `/agent-inbox/${encodeURIComponent(channel)}/${encodeURIComponent(number)}/thread/${encodeURIComponent(thread)}`, params, undefined, opts);
  }
  features(opts?: RequestOptions): Promise<C.InboxFeaturesResponse> {
    return this.http.request('GET', '/agent-inbox/features', undefined, undefined, opts);
  }
  numbers(params: C.InboxNumbersQuery = {}, opts?: RequestOptions): Promise<C.InboxNumbersResponse> {
    return this.http.request('GET', '/agent-inbox/numbers', undefined, { ...params }, opts);
  }
  retention(params: C.InboxRetentionQuery = {}, opts?: RequestOptions): Promise<C.InboxRetentionResponse> {
    return this.http.request('GET', '/agent-inbox/retention', undefined, { ...params }, opts);
  }
}
