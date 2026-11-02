/** PUT replaces provider configuration. Omitted fields use the server defaults. */
interface Common { is_active?: boolean; agent_id?: string }
export interface CalcomSettings extends Common { api_key: string; username: string; event_slug: string; default_timezone?: string }
export interface SlackSettings extends Common { webhook_url: string }
export interface ZapierSettings extends Common { post_call_url: string }
export type MakeSettings = Common & { tool_name?: string; tool_description?: string; parameters?: Record<string, unknown> } &
  ({ post_call_url: string; in_call_url?: string } | { post_call_url?: string; in_call_url: string });
export interface GoHighLevelSettings extends Common { pit: string; location_id: string; tags?: string[] | string }
export interface IntegrationSettings {
  calcom: CalcomSettings; slack: SlackSettings; zapier: ZapierSettings; make: MakeSettings;
  gohighlevel: GoHighLevelSettings; webhook: { url: string }; webhook2: { url: string };
  precall: { url: string }; 'web-calls': { enabled: boolean };
}
export type IntegrationProvider = keyof IntegrationSettings;
interface NumberState { phone_number: string }
interface ActiveState extends NumberState { is_active: boolean }
export interface IntegrationReads {
  calcom: ActiveState & { username: string; event_slug: string; default_timezone: string; api_key_set: boolean };
  slack: ActiveState & { webhook_url_set: boolean };
  zapier: ActiveState & { post_call_url_set: boolean };
  make: ActiveState & { post_call_url_set: boolean; in_call_url_set: boolean; tool_name: string | null; tool_description: string | null; parameters: Record<string, unknown> | null };
  gohighlevel: ActiveState & { pit_set: boolean; location_id: string; tags: string[] };
  webhook: NumberState & { webhook_url: string | null; is_set: boolean };
  webhook2: NumberState & { webhook_url_2: string | null; is_set: boolean };
  precall: NumberState & { precall_webhook_url: string | null; is_set: boolean };
  'web-calls': NumberState & { web_calls_enabled: boolean };
}
export interface IntegrationReceipt { ok: boolean; phone_number?: string; agent_id?: string; provider?: string; is_active?: boolean; deleted?: boolean; web_calls_enabled?: boolean }
export interface AgentPrecall { agent_id: string; precall_webhook_url: string | null; is_set: boolean }
export interface CustomFunctionInput {
  name: string; url: string; description?: string; method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>; parameters?: Record<string, unknown>; speak_during?: string | null;
  /** Server clamps to 1000..45000; default 5000. */
  timeout_ms?: number; is_active?: boolean;
}
export interface CustomFunctionView {
  id: string; name: string; description: string; method: string; url: string; parameters: Record<string, unknown>;
  speak_during: string | null; timeout_ms: number; is_active: boolean; has_headers: boolean;
}
export interface FunctionReceipt { ok: boolean; id: string; phone_number: string; name?: string; deleted?: boolean }
