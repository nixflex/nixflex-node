import type { HttpClient, RequestOptions } from '../client.js';
import type * as C from '../types/web-agent.js';
export class WebAgent {
  constructor(private readonly http: HttpClient) {}
  get(number: string, opts?: RequestOptions): Promise<C.WebAgentReadResponse> {
    return this.http.request('GET', `/agent-web/${encodeURIComponent(number)}`, undefined, undefined, opts);
  }
  update(number: string, params: C.WebAgentUpdateParams, opts?: RequestOptions): Promise<C.WebAgentUpdateResponse> {
    return this.http.request('PATCH', `/agent-web/${encodeURIComponent(number)}`, params, undefined, opts);
  }
}
