import type { HttpClient, RequestOptions } from '../client.js';
import type * as C from '../types/contacts.js';
export class Contacts {
  constructor(private readonly http: HttpClient) {}
  preview(params: C.ContactPreviewParams, opts?: RequestOptions): Promise<C.ContactPreviewResponse> {
    return this.http.request('POST', '/contact-hours/preview', params, undefined, opts);
  }
  list(params: C.ContactListQuery = {}, opts?: RequestOptions): Promise<C.ContactListResponse> {
    return this.http.request('GET', '/contact-suppressions', undefined, { ...params }, opts);
  }
  add(params: C.ContactAddParams, opts?: RequestOptions): Promise<C.ContactAddResponse> {
    return this.http.request('POST', '/contact-suppressions', params, undefined, opts);
  }
  remove(params: C.ContactRemoveParams, opts?: RequestOptions): Promise<C.ContactRemoveResponse> {
    return this.http.request('DELETE', '/contact-suppressions', params, undefined, opts);
  }
}
