import { NixflexError } from '../errors.js';
const codes = new Set(['unknown_error','invalid_phone','missing_field','invalid_url','invalid_name','invalid_method',
  'limit_reached','duplicate_function','no_fields','not_found','server_error','booking_provider_conflict',
  'outcome_unknown','unauthorized','invalid_api_key','forbidden','rate_limit_exceeded','account_inactive',
  'account_closed','invalid_json','organisation_unavailable','invalid_filter']);
const publicFields = new Set(['ok','phone_number','agent_id','provider','is_active','deleted','web_calls_enabled',
  'id','name','functions','method','timeout_ms','has_headers','is_set','api_key_set','webhook_url_set',
  'post_call_url_set','in_call_url_set','pit_set','username','event_slug','default_timezone','location_id','tags','tool_name']);
/** CLI display only. SDK callers still receive the actual wire response. */
export function integrationOutput(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(integrationOutput);
  if (!value || typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (/^(api_key|pit|headers|signing_secret|secret|token|authorization|parameters|tool_description|description|speak_during)$/i.test(key) || /(?:^|_)url(?:_2)?$/.test(key)) {
      result[key] = item == null ? null : '[omitted: private configuration]';
    } else if (publicFields.has(key)) result[key] = integrationOutput(item);
  }
  return result;
}
export async function privateIntegration(action: () => Promise<unknown>): Promise<unknown> {
  try { return integrationOutput(await action()); }
  catch (error) {
    const e = error as NixflexError;
    const code = codes.has(e.code) ? e.code : 'integration_request_failed';
    const unknown = e.code === 'outcome_unknown';
    throw new NixflexError(Number.isInteger(e.status) ? e.status : 0, { error: {
      type: unknown ? 'outcome_unknown' : 'integration_error', code,
      message: unknown ? 'Outcome unknown. Check the current state before retrying; the change was not repeated.' : 'Integration request failed. Check the status and error code; private details are omitted.',
      details: unknown ? { outcome: 'unknown', safe_to_retry: false } : {},
    } });
  }
}
