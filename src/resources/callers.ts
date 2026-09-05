// ============================================
// src/resources/callers.ts
// client.callers - caller context on one of your numbers.
//   await client.callers.set('+447450307843', '+447453573770', { name: 'Sam Carter', email: 'sam@example.com' });
//   await client.callers.get('+447450307843', '+447453573770');
//   await client.callers.import('+447450307843', [{ caller_number: '+44...', name: '...' }]);
//   await client.callers.delete('+447450307843', '+447453573770');
// ============================================
import type { HttpClient, RequestOptions } from '../client.js';
import type {
  CallerContextSetParams, CallerContextResponse, CallerContextDeleteResponse,
  CallerImportRow, CallerImportResponse,
} from '../types/callers.js';

/** E.164 numbers go in URL paths - the + MUST be encoded or routing breaks. */
function enc(phoneNumber: string): string {
  return encodeURIComponent(phoneNumber);
}

export class Callers {
  constructor(private readonly http: HttpClient) {}

  /** What the agent knows about this caller on this number - your fields plus
   * what the engine learned. 404 caller_not_found when there is no record. */
  get(phoneNumber: string, callerNumber: string, opts?: RequestOptions): Promise<CallerContextResponse> {
    return this.http.request('GET', `/phone-numbers/${enc(phoneNumber)}/callers/${enc(callerNumber)}`, undefined, undefined, opts);
  }

  /** Set the caller's details. A field left out keeps its value; null removes it.
   * last_call / open_item are engine-only and are rejected (engine_only_field). */
  set(phoneNumber: string, callerNumber: string, params: CallerContextSetParams, opts?: RequestOptions): Promise<CallerContextResponse> {
    return this.http.request('PUT', `/phone-numbers/${enc(phoneNumber)}/callers/${enc(callerNumber)}`, params, undefined, opts);
  }

  /** Erase the whole record for this caller on this number - yours and the engine's. */
  delete(phoneNumber: string, callerNumber: string, opts?: RequestOptions): Promise<CallerContextDeleteResponse> {
    return this.http.request('DELETE', `/phone-numbers/${enc(phoneNumber)}/callers/${enc(callerNumber)}`, undefined, undefined, opts);
  }

  /** Up to 1,000 rows in one request. Every row is validated before any is
   * written. Split larger lists into several calls. */
  import(phoneNumber: string, callers: CallerImportRow[], opts?: RequestOptions): Promise<CallerImportResponse> {
    return this.http.request('POST', `/phone-numbers/${enc(phoneNumber)}/callers/import`, { callers }, undefined, opts);
  }
}
