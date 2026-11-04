import { NixflexError } from './errors.js';
export const calendarErrorCodes = ['invalid_return_url','number_not_found','already_connected',
  'booking_provider_conflict','not_connected','agent_not_assigned','invalid_settings','invalid_timezone',
  'invalid_hours','invalid_slot_minutes','invalid_calendar_id','invalid_send_invites','calendar_unavailable',
  'expired_link','not_configured','guard_unavailable'] as const;
export const credentialErrorCodes = ['invalid_request','invalid_credentials','number_not_in_account',
  'number_not_found','carrier_mismatch','account_unavailable','number_operation_pending','number_release_pending',
  'carrier_unavailable','credential_update_unavailable','carrier_outcome_unknown','credential_save_pending'] as const;
export type GoogleCalendarErrorCode = typeof calendarErrorCodes[number];
export type NumberCredentialsErrorCode = typeof credentialErrorCodes[number];
const common = ['unauthorized','invalid_api_key','permission_denied','forbidden','rate_limit_exceeded',
  'organisation_disabled','organisation_unavailable','account_closed','account_inactive','outcome_unknown'];
/** Safe, typed feature error. No raw response body/message, token, URL or carrier input. */
export class NixflexCalendarError extends NixflexError {}
export class NixflexCredentialError extends NixflexError {}
export function featureError(value: unknown, kind: 'calendar' | 'credentials', mutation: boolean): NixflexError {
  const e = value as NixflexError;
  const status = Number.isInteger(e?.status) && e.status >= 0 && e.status <= 599 ? e.status : 0;
  const original = e?.code === 'outcome_unknown' ? e.details?.original_code : e?.code;
  const allowed: readonly string[] = kind === 'calendar' ? calendarErrorCodes : credentialErrorCodes;
  const code = typeof original === 'string' && (allowed.includes(original) || common.includes(original))
    ? original : e?.code === 'outcome_unknown' ? 'outcome_unknown' : 'request_failed';
  const uncertain = mutation && (e?.code === 'outcome_unknown' || status === 0 || status >= 500 || (status >= 300 && status < 400));
  const details: Record<string, unknown> = uncertain ? {outcome:'unknown',safe_to_retry:false} : {};
  if (/^[a-f0-9-]{36}$/i.test(String(e?.details?.operation_id || ''))) details.operation_id = e.details.operation_id;
  const type = status === 400 || status === 422 ? 'invalid_request' : status === 409 ? 'conflict'
    : status === 404 ? 'not_found' : status === 401 ? 'authentication_error' : status === 403 ? 'permission_denied'
    : status === 429 ? 'rate_limit' : status >= 500 ? 'server_error' : uncertain ? 'outcome_unknown' : 'error';
  let message = kind === 'calendar' ? 'Google Calendar request failed. Check status and code.' : 'Carrier details update failed. Check status and code.';
  if (code === 'carrier_outcome_unknown') message = 'Carrier routing is unconfirmed. Contact support before retrying.';
  else if (code === 'credential_save_pending') message = 'Carrier change succeeded; saving is pending. Retry manually with exactly the same details to finish saving.';
  else if (uncertain) message += ' Outcome is unconfirmed; check before retrying. No automatic repeat.';
  const ErrorClass = kind === 'calendar' ? NixflexCalendarError : NixflexCredentialError;
  const result = new ErrorClass(status, {error:{type,code,message,details}});
  result.name = kind === 'calendar' ? 'NixflexCalendarError' : 'NixflexCredentialError';
  if (uncertain) Object.assign(result, {outcome:'unknown',safe_to_retry:false});
  return result;
}
