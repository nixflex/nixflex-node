import type { HttpClient, RequestOptions } from '../client.js';
export interface PhoneNumberMoveParams { agent_id: string }
export interface PhoneNumberMoveResponse {
  phone_number: { phone_number: string; agent_id: string; agent_name: string; changed: boolean };
}
export function moveNumber(http: HttpClient, number: string, params: PhoneNumberMoveParams, opts?: RequestOptions): Promise<PhoneNumberMoveResponse> {
  if (Object.keys(params).length !== 1 || typeof params.agent_id !== 'string' || !params.agent_id.trim()) {
    throw new Error('Send only agent_id when moving a number. Update other settings separately.');
  }
  return http.request('PATCH', `/phone-numbers/${encodeURIComponent(number)}`, params, undefined, opts);
}
