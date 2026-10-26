import type { AgentListParams } from '../types/agents.js';
export const agentListFlags = { offset: { type: 'string' as const }, search: { type: 'string' as const } };
export function agentListParams(values: Record<string, unknown>): AgentListParams {
  const out: AgentListParams = {};
  for (const [key, min, max] of [['limit', 1, 200], ['offset', 0, 1000000]] as const) {
    const value = values[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value) || Number(value) < min || Number(value) > max) {
      throw new Error(`--${key} must be a whole number from ${min} to ${max}.`);
    }
    out[key] = Number(value);
  }
  if (values.status !== undefined) {
    if (!['active', 'disabled', 'all'].includes(values.status as string)) throw new Error('--status must be active, disabled or all.');
    out.status = values.status as AgentListParams['status'];
  }
  if (values.search !== undefined) {
    if (typeof values.search !== 'string' || values.search.length > 200 || /[\u0000-\u001f\u007f]/.test(values.search)) throw new Error('--search must be text of at most 200 characters without control characters.');
    out.search = values.search;
  }
  return out;
}
