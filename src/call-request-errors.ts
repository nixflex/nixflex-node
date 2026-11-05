import { NixflexError } from './errors.js';

export class NixflexOutboundRequestError extends NixflexError {}
export class NixflexOutboundRequestPendingError extends NixflexOutboundRequestError {}
export class NixflexOutboundRequestUnknownError extends NixflexOutboundRequestError {}
export class NixflexRequestIdConflictError extends NixflexOutboundRequestError {}
export class NixflexOutboundRequestUnavailableError extends NixflexOutboundRequestError {}
export class NixflexCallBookingsUnavailableError extends NixflexError {}
const classes = {
  outbound_request_pending: NixflexOutboundRequestPendingError,
  outbound_request_unknown: NixflexOutboundRequestUnknownError,
  request_id_conflict: NixflexRequestIdConflictError,
  outbound_request_unavailable: NixflexOutboundRequestUnavailableError,
};
export function outboundRequestError(value: unknown, requestId: string, mutation: boolean): NixflexError {
  const e = value as NixflexError, raw = e?.details || {};
  const status = Number.isInteger(e?.status) && e.status >= 0 && e.status <= 599 ? e.status : 0;
  const original = e?.code === 'outcome_unknown' ? raw.original_code : e?.code;
  const code = typeof original === 'string' && /^[a-z][a-z0-9_]{0,79}$/.test(original)
    && !['unknown_error','invalid_response'].includes(original) ? original
    : mutation ? 'outbound_request_unknown' : 'outbound_request_unavailable';
  const details: Record<string, unknown> = { request_id: requestId };
  if (['pending','accepted','rejected','unknown'].includes(String(raw.state))) details.state = raw.state;
  if (mutation) {
    details.safe_to_retry = false;
    if (!details.state && (status === 0 || code === 'outbound_request_unknown')) details.state = 'unknown';
  }
  const type = ({400:'invalid_request',422:'invalid_request',401:'authentication_error',402:'payment_required',
    403:'permission_denied',404:'not_found',409:'conflict',429:'rate_limit'} as Record<number,string>)[status]
    || (status >= 500 ? 'server_error' : status === 0 && mutation ? 'outcome_unknown' : 'error');
  const ErrorClass = classes[code as keyof typeof classes] || NixflexOutboundRequestError;
  const result = new ErrorClass(status, {error:{type,code,
    message: mutation ? 'Call request not confirmed. Keep this request_id; check its status and Call History before any manual retry. No automatic repeat.'
      : 'Call request status could not be read. Check the error code; this read placed no call.', details}});
  result.name = ErrorClass.name;
  return result;
}
