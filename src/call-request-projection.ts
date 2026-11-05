import { NixflexConnectionError } from './errors.js';
import type { CallBookings, OutboundCallRequest } from './types/call-requests.js';

export const requestUuid = (v: unknown): v is string => typeof v === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function requestId(value: unknown): string {
  if (!requestUuid(value)) throw new TypeError('request_id must be a UUID. No request sent.');
  return value;
}
export function callIdentifier(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 200 || ['.','..'].includes(value) || /[\u0000-\u001f]/.test(value))
    throw new TypeError('call_id must be an existing call identifier. No request sent.');
  return value;
}
const invalid = (): never => { throw new NixflexConnectionError('Invalid call result shape. No result was inferred.'); };
const object = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v : invalid();
const nullable = (v: unknown) => v === null || typeof v === 'string';
const appointment = ['start','end','attendee_name','attendee_email','service','timezone'];
function row(value: unknown, final: boolean) {
  const v = object(value), fields = final ? ['booking_uid','status',...appointment] : ['action','booking_uid',...appointment,'at'];
  if (typeof v.booking_uid !== 'string' || !v.booking_uid ||
    appointment.some(k => k === 'service' ? !(nullable(v[k]) || typeof v[k] === 'number' && Number.isFinite(v[k])) : !nullable(v[k])) ||
    (final ? !['active','cancelled'].includes(v.status) : !['created','rescheduled','cancelled'].includes(v.action) || typeof v.at !== 'string')) invalid();
  return Object.fromEntries(fields.map(k => [k,v[k]]));
}
export function callBookings(value: unknown, id: string): CallBookings {
  const v = object(value);
  if (v.call_id !== id || !['ready','none','processing','deleted','unavailable'].includes(v.state)) invalid();
  if (v.state !== 'ready') {
    if (v.result !== null) invalid();
    return {call_id:id,state:v.state,result:null};
  }
  const r = object(v.result), fields = ['event','call_id','agent_id','from','to','number','ended_at'];
  if (r.event !== 'call.bookings' || r.call_id !== id || fields.slice(2).some(k => !nullable(r[k]))
    || !Array.isArray(r.timeline) || !r.timeline.length || !Array.isArray(r.final) || !r.final.length) invalid();
  return {call_id:id,state:'ready',result:{...Object.fromEntries(fields.map(k => [k,r[k]])),
    timeline:r.timeline.map((v: unknown) => row(v,false)),final:r.final.map((v: unknown) => row(v,true))}} as CallBookings;
}
export function outboundRequest(value: unknown, id: string): OutboundCallRequest {
  const v = object(value);
  if (typeof v.request_id !== 'string' || v.request_id.toLowerCase() !== id.toLowerCase()
    || !['pending','accepted','rejected','unknown'].includes(v.state) || !nullable(v.call_id) || !nullable(v.reason)
    || v.state === 'accepted' && !v.call_id) invalid();
  return {request_id:v.request_id,state:v.state,call_id:v.call_id,reason:v.reason};
}
