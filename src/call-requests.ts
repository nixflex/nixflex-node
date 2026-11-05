import { randomUUID } from 'node:crypto';
import type { HttpClient, RequestOptions } from './client.js';
import { NixflexError, NixflexConnectionError } from './errors.js';
import { NixflexCallBookingsUnavailableError, outboundRequestError } from './call-request-errors.js';
import { requestId, callIdentifier, callBookings, outboundRequest } from './call-request-projection.js';
import type { OutboundCallParams, OutboundCallResponse } from './types/calls.js';
import type { PreparedOutboundCall, OutboundRequestReceipt } from './types/call-requests.js';

/** Local preparation only. Save this body before the first create, then reuse it unchanged. */
export function prepareOutboundCall(params: OutboundCallParams): PreparedOutboundCall {
  const id = params.request_id === undefined ? randomUUID() : requestId(params.request_id);
  return {...JSON.parse(JSON.stringify(params)),request_id:id};
}
export async function createOutboundRequest(http: HttpClient, params: OutboundCallParams, opts?: RequestOptions): Promise<OutboundRequestReceipt> {
  const id = requestId(params.request_id);
  try {
    const value = await http.request<OutboundRequestReceipt>('POST','/calls/outbound',params,undefined,opts);
    if (!value || typeof value.call_id !== 'string' || !value.call_id || value.call_id.length > 200
      || /[\u0000-\u0020]/.test(value.call_id) || value.status !== 'initiated'
      || typeof value.request_id !== 'string' || value.request_id.toLowerCase() !== id.toLowerCase()
      || value.replayed !== undefined && value.replayed !== true
      || value.request_status !== undefined && (value.request_status !== 'unconfirmed' || value.safe_to_retry !== false)
      || value.safe_to_retry !== undefined && value.safe_to_retry !== false) throw new NixflexConnectionError('Invalid acceptance receipt.');
    return value;
  } catch (e) { throw outboundRequestError(e,id,true); }
}
export async function readCallBookings(http: HttpClient, id: string, opts?: RequestOptions) {
  callIdentifier(id);
  try { return callBookings(await http.request('GET',`/calls/${encodeURIComponent(id)}/bookings`,undefined,undefined,opts),id); }
  catch (e) {
    if (!(e instanceof NixflexError) || e.code !== 'call_bookings_unavailable') throw e;
    const result = new NixflexCallBookingsUnavailableError(e.status,{error:{type:e.type,code:e.code,
      message:'The booking result could not be checked. This does not mean no booking was made.',details:{}}});
    result.name = 'NixflexCallBookingsUnavailableError'; throw result;
  }
}
export async function readOutboundRequest(http: HttpClient, id: string, opts?: RequestOptions) {
  requestId(id);
  try { return outboundRequest(await http.request('GET',`/calls/outbound/requests/${encodeURIComponent(id)}`,undefined,undefined,opts),id); }
  catch (e) { if (e instanceof NixflexError && e.code === 'outbound_request_unavailable') throw outboundRequestError(e,id,false); throw e; }
}
