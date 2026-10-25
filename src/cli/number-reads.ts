import type Nixflex from '../index.js';
import type { PhoneNumberListParams } from '../types/phone-numbers.js';

export async function readNumber(client: Nixflex, cmd: string, number: string, s: (k: string) => string | undefined, json: boolean): Promise<unknown> {
  if (cmd === 'get') {
    if (!number) throw new Error('numbers get <number>');
    return client.phoneNumbers.get(number);
  }
  const provider = s('provider');
  if (provider !== undefined && provider !== 'twilio' && provider !== 'telnyx') throw new Error('--provider must be twilio or telnyx');
  const raw = s('limit');
  if (raw !== undefined && (!/^[1-9]\d*$/.test(raw) || Number(raw) > 100)) throw new Error('--limit must be 1..100');
  const params: PhoneNumberListParams = { agent_id: s('agent'), provider, limit: raw === undefined ? undefined : Number(raw), cursor: s('cursor') };
  const result = await client.phoneNumbers.list(params);
  // Keep the legacy plain table, but expose next_cursor when paging is requested.
  return json || params.limit !== undefined || params.cursor !== undefined ? result : result.phone_numbers;
}
