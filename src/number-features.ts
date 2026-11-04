import type { HttpClient, RequestOptions } from './client.js';
import { featureError } from './feature-errors.js';
import type { NumberCredentials, NumberCredentialsUpdated } from './types/google-calendar.js';
export async function numberFeature<T>(http: HttpClient, method: 'GET'|'POST'|'PATCH'|'DELETE',
  path: string, body: unknown, kind: 'calendar'|'credentials', opts?: RequestOptions): Promise<T> {
  try { return await http.request<T>(method,path,body,undefined,opts); }
  catch (e) { throw featureError(e,kind,method !== 'GET'); }
}
export const calendarPath = (number: string) => `/integrations/google-calendar/number/${encodeURIComponent(number)}`;
/** Exact credential pair only. Validation errors never include submitted values. */
export function credentialPair(body: NumberCredentials): NumberCredentials {
  const keys = body && typeof body === 'object' ? Object.keys(body) : [];
  const fields = keys.includes('twilio_sid') ? ['twilio_sid','twilio_token'] : ['telnyx_api_key','telnyx_connection_id'];
  const values = body as unknown as Record<string, unknown>;
  if (keys.length !== 2 || keys.some(k => !fields.includes(k)) || fields.some(k =>
    typeof values[k] !== 'string' || !values[k].trim() || values[k].length > 4096 || /[\r\n\x00]/.test(values[k] as string)))
    throw new TypeError('Supply exactly one complete carrier credential pair privately.');
  const clean = Object.fromEntries(fields.map(k => [k,(values[k] as string).trim()]));
  if (fields[0] === 'twilio_sid' ? !/^AC[a-f0-9]{32}$/i.test(clean.twilio_sid) : clean.telnyx_connection_id.length > 200)
    throw new TypeError('Invalid carrier credential format.');
  return clean as unknown as NumberCredentials;
}
export async function updateCredentials(http: HttpClient, number: string, body: NumberCredentials, opts?: RequestOptions): Promise<NumberCredentialsUpdated> {
  const result = await numberFeature<NumberCredentialsUpdated>(http,'POST',`/phone-numbers/${encodeURIComponent(number)}/credentials`,credentialPair(body),'credentials',opts);
  // Never expose unexpected response fields on this secret-handling route.
  if (!result || result.updated !== true || result.phone_number !== number || result.provider !== ('twilio_sid' in body ? 'twilio' : 'telnyx'))
    throw featureError({status:0},'credentials',true);
  return {phone_number:result.phone_number,provider:result.provider,updated:true};
}
