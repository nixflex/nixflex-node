import type { HttpClient, RequestOptions } from '../client.js';
import type { AccountRetention, Voice, VoiceContext, VoiceListParams, VoiceListResponse } from '../types/core.js';

/** Account defaults only; account closure remains dashboard-owner-only. */
export class Account {
  constructor(private readonly http: HttpClient) {}
  retention(opts?: RequestOptions): Promise<AccountRetention> {
    return this.http.request('GET', '/account/retention', undefined, undefined, opts);
  }
}

export class Voices {
  constructor(private readonly http: HttpClient) {}
  list(params: VoiceListParams = {}, opts?: RequestOptions): Promise<VoiceListResponse> {
    return this.http.request('GET', '/voices', undefined, { ...params }, opts);
  }
  get(voiceKey: string, params: VoiceContext = {}, opts?: RequestOptions): Promise<Voice> {
    return this.http.request('GET', `/voices/${encodeURIComponent(voiceKey)}`, undefined, { ...params }, opts);
  }
}
