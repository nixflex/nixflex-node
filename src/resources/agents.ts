// ============================================
// src/resources/agents.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type { Agent, AgentCreateParams, AgentUpdateParams, AgentDeleteResponse, ListParams } from '../types/agents.js';

export class Agents {
  constructor(private readonly http: HttpClient) {}

  /** Create an agent. Every field has a sensible default - `{ name }` alone works.
   * The agent is immediately usable for numbers and outbound calls. */
  create(params: AgentCreateParams = {}, opts?: RequestOptions): Promise<Agent> {
    return this.http.request<Agent>('POST', '/agents', params, undefined, opts);
  }

  /** List active agents, newest first. Default 100, hard cap 200 per page. */
  list(params: ListParams = {}, opts?: RequestOptions): Promise<Agent[]> {
    return this.http.request<Agent[]>('GET', '/agents', undefined, { limit: params.limit, offset: params.offset }, opts);
  }

  /** Iterate ALL agents across pages: `for await (const a of client.agents.iter()) { ... }` */
  async *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Agent> {
    let offset = 0;
    while (true) {
      const page = await this.list({ limit: pageSize, offset }, opts);
      for (const item of page) yield item;
      if (page.length < pageSize) return;
      offset += page.length;
    }
  }

  /** Fetch one agent with full configuration. Throws NixflexNotFoundError if the ID is not yours. */
  get(agentId: string, opts?: RequestOptions): Promise<Agent> {
    return this.http.request<Agent>('GET', `/agents/${encodeURIComponent(agentId)}`, undefined, undefined, opts);
  }

  /** Update an agent. Send ONLY the fields you want to change - omitted fields
   * keep their values. Active calls are unaffected; new calls use the new config.
   * Unknown field names return 200 and change nothing - check spelling. */
  update(agentId: string, params: AgentUpdateParams, opts?: RequestOptions): Promise<Agent> {
    return this.http.request<Agent>('PUT', `/agents/${encodeURIComponent(agentId)}`, params, undefined, opts);
  }

  /** PERMANENTLY delete an agent. Attached numbers detach and stop routing;
   * historical calls stay accessible. To disable without losing setup, use
   * update(agentId, { is_active: false }) instead. */
  delete(agentId: string, opts?: RequestOptions): Promise<AgentDeleteResponse> {
    return this.http.request<AgentDeleteResponse>('DELETE', `/agents/${encodeURIComponent(agentId)}`, undefined, undefined, opts);
  }
}
