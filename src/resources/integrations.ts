import type { HttpClient, RequestOptions } from '../client.js';
import type { IntegrationProvider, IntegrationSettings, IntegrationReads, IntegrationReceipt, AgentPrecall,
  CustomFunctionInput, CustomFunctionView, FunctionReceipt } from '../types/integrations.js';
const providers: IntegrationProvider[] = ['calcom', 'slack', 'zapier', 'make', 'gohighlevel', 'webhook', 'webhook2', 'precall', 'web-calls'];
function path(provider: IntegrationProvider, number: string) {
  if (!providers.includes(provider)) throw new TypeError('Unknown public integration provider.');
  return `/integrations/${provider}/number/${encodeURIComponent(number)}`;
}
const functions = (number: string) => `/integrations/custom-functions/number/${encodeURIComponent(number)}`;
/** API-key authority, owned numbers only. No automatic logging of configuration. */
export class Integrations {
  constructor(private readonly http: HttpClient) {}
  get<P extends IntegrationProvider>(provider: P, number: string, opts?: RequestOptions): Promise<IntegrationReads[P]> {
    return this.http.request('GET', path(provider, number), undefined, undefined, opts);
  }
  /** Provider PUT replaces configuration. Never automatically repeated. */
  set<P extends IntegrationProvider>(provider: P, number: string, body: IntegrationSettings[P], opts?: RequestOptions): Promise<IntegrationReceipt> {
    return this.http.request('PUT', path(provider, number), body, undefined, opts);
  }
  delete(provider: IntegrationProvider, number: string, opts?: RequestOptions): Promise<IntegrationReceipt> {
    return this.http.request('DELETE', path(provider, number), undefined, undefined, opts);
  }
  getAgentPrecall(agentId: string, opts?: RequestOptions): Promise<AgentPrecall> {
    return this.http.request('GET', `/integrations/precall/agent/${encodeURIComponent(agentId)}`, undefined, undefined, opts);
  }
  setAgentPrecall(agentId: string, url: string, opts?: RequestOptions): Promise<IntegrationReceipt> {
    return this.http.request('PUT', `/integrations/precall/agent/${encodeURIComponent(agentId)}`, { url }, undefined, opts);
  }
  /** Removing the agent default affects every number without an override. */
  deleteAgentPrecall(agentId: string, opts?: RequestOptions): Promise<IntegrationReceipt> {
    return this.http.request('DELETE', `/integrations/precall/agent/${encodeURIComponent(agentId)}`, undefined, undefined, opts);
  }
  /** At most 15; an empty list is not proof that the number exists. */
  listFunctions(number: string, opts?: RequestOptions): Promise<{ phone_number: string; functions: CustomFunctionView[] }> {
    return this.http.request('GET', functions(number), undefined, undefined, opts);
  }
  createFunction(number: string, body: CustomFunctionInput, opts?: RequestOptions): Promise<FunctionReceipt> {
    return this.http.request('POST', functions(number), body, undefined, opts);
  }
  /** PATCH changes supplied fields only. {} is refused by the server. */
  updateFunction(number: string, id: string, body: Partial<CustomFunctionInput>, opts?: RequestOptions): Promise<FunctionReceipt> {
    return this.http.request('PATCH', functions(number) + '/' + encodeURIComponent(id), body, undefined, opts);
  }
  deleteFunction(number: string, id: string, opts?: RequestOptions): Promise<FunctionReceipt> {
    return this.http.request('DELETE', functions(number) + '/' + encodeURIComponent(id), undefined, undefined, opts);
  }
}
