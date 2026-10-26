// ============================================
// src/resources/agents.ts
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type { Agent, AgentCreateParams, AgentUpdateParams, AgentDeleteResponse, AgentListParams } from '../types/agents.js';

export class Agents {
  constructor(private readonly http: HttpClient) {}

  /** Create an agent. Every field has a sensible default - `{ name }` alone works.
   * The agent is immediately usable for numbers and outbound calls. */
  create(params: AgentCreateParams = {}, opts?: RequestOptions): Promise<Agent> {
    return this.http.request<Agent>('POST', '/agents', params, undefined, opts);
  }

  /** Bare array. Active by default; stable created_at DESC, agent_id DESC order. */
  list(params: AgentListParams = {}, opts?: RequestOptions): Promise<Agent[]> {
    return this.http.request<Agent[]>('GET', '/agents', undefined, { limit: params.limit, offset: params.offset, status: params.status, search: params.search }, opts);
  }

  /** Iterate active agents across pages. pageSize must be a whole number 1..200.
   * Offset pages are not a snapshot: concurrent creates/disables can shift rows. */
  async *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Agent> {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) throw new RangeError('Agent pageSize must be a whole number from 1 to 200.');
    let offset = 0;
    while (true) {
      if (offset > 1000000) throw new RangeError('Agent iteration exceeds the maximum offset of 1000000.');
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
   * Empty/unknown-only updates fail; mixed unknown keys return warnings. */
  update(agentId: string, params: AgentUpdateParams, opts?: RequestOptions): Promise<Agent> {
    return this.http.request<Agent>('PUT', `/agents/${encodeURIComponent(agentId)}`, params, undefined, opts);
  }

  /** Soft disable only (is_active=false). Does not detach numbers or erase history.
   * The legacy response message is "Agent deleted". */
  delete(agentId: string, opts?: RequestOptions): Promise<AgentDeleteResponse> {
    return this.http.request<AgentDeleteResponse>('DELETE', `/agents/${encodeURIComponent(agentId)}`, undefined, undefined, opts);
  }
}
