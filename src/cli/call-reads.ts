import type Nixflex from '../index.js';
import type { CallHistoryParams } from '../types/call-reads.js';
export const callReadFlags = Object.fromEntries(['number','direction','outcome','source','period','since','until'].map(k => [k, { type: 'string' as const }]));
export function callHistoryParams(values: Record<string, unknown>): CallHistoryParams {
  const out: Record<string, string | number> = {};
  for (const [k,min,max] of [['limit',1,200],['offset',0,1000000]] as const) {
    if (values[k] === undefined) continue;
    const v = values[k];
    if (typeof v !== 'string' || !/^(0|[1-9]\d*)$/.test(v) || +v < min || +v > max) throw new Error(`Invalid --${k}.`);
    out[k] = +v;
  }
  for (const k of ['agent','number','direction','outcome','source','period','since','until','search','cursor']) {
    if (values[k] !== undefined) { if (typeof values[k] !== 'string') throw new Error(`Invalid --${k}.`); out[k] = values[k] as string; }
  }
  return out as CallHistoryParams;
}
export async function callRead(client: Nixflex, command: string, id: string | undefined, values: Record<string, unknown>): Promise<unknown> {
  if (command === 'history') return client.calls.history(callHistoryParams(values));
  if (!id) throw new Error(`calls ${command} requires a call ID.`);
  if (command === 'read') return client.calls.read(id);
  if (command === 'recording') return client.calls.recording(id);
  if (command === 'billing') return client.calls.billing(id);
  throw new Error('Unknown call read.');
}
