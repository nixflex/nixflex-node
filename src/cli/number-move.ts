import type Nixflex from '../index.js';
export function numberMove(client: Nixflex, number: string, agent: string | undefined, body: Record<string, unknown>) {
  if (!number || !agent?.trim()) throw new Error('numbers move <number> --agent <agent_id>');
  if (Object.keys(body).length) throw new Error('Move the number separately from other settings. Send only --agent.');
  return client.phoneNumbers.move(number, agent);
}
