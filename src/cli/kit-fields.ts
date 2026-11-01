/** Keep recipient location beside variables, never mixed into template values. */
export function recipientField(rec: Record<string, unknown>, key: string, value: string): boolean {
  if (key !== 'country' && key !== 'timezone') return false;
  rec[key] = value;
  return true;
}
export const kitFlags = Object.fromEntries(['recipient-country', 'recipient-timezone', 'before', 'recipient-cursor', 'message-cursor']
  .map(key => [key, { type: 'string' as const }]));
export function contactFields(values: Record<string, unknown>): Record<string, unknown> {
  return { recipient_country: values['recipient-country'], recipient_timezone: values['recipient-timezone'] };
}
export function smsPage(values: Record<string, unknown>) {
  const result: Record<string, string | number> = {};
  if (values.limit !== undefined) {
    if (typeof values.limit !== 'string' || !/^[1-9]\d*$/.test(values.limit) || +values.limit > 500)
      throw new Error('SMS detail --limit must be 1..500.');
    result.limit = +values.limit;
  }
  for (const key of ['recipient-cursor', 'message-cursor']) if (values[key] !== undefined) {
    if (typeof values[key] !== 'string') throw new Error(`Invalid --${key}.`);
    result[key.replace('-', '_')] = values[key] as string;
  }
  return result;
}
