import type { HttpClient, RequestOptions } from '../client.js';
import type { NumberUsageParams, NumberUsageResponse } from '../types/number-usage.js';
export function readNumberUsage(http: HttpClient, phone: string, params: NumberUsageParams = {}, opts?: RequestOptions): Promise<NumberUsageResponse> {
  return http.request('GET', `/phone-numbers/${encodeURIComponent(phone)}/usage`, undefined,
    { period: params.period, time_zone: params.time_zone }, opts);
}
