import type Nixflex from '../index.js';
import type { NumberUsagePeriod } from '../types/number-usage.js';
export function numberUsage(client: Nixflex, number: string, option: (key: string) => string | undefined) {
  if (!/^\+[1-9]\d{6,14}$/.test(number || '')) throw new Error('numbers usage <E.164 number> [--period today|7|14|30|90|all] [--time-zone Europe/London]');
  const period = option('period') ?? 'all', timeZone = option('time-zone') ?? 'UTC';
  if (!['today','7','14','30','90','all'].includes(period)) throw new Error('--period must be today, 7, 14, 30, 90 or all');
  if (timeZone !== 'UTC' && !timeZone.includes('/')) throw new Error('--time-zone must be an IANA zone, or UTC');
  new Intl.DateTimeFormat('en', {timeZone});
  return client.phoneNumbers.usage(number, {period:period as NumberUsagePeriod,time_zone:timeZone});
}
