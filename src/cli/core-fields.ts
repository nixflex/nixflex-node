import type Nixflex from '../index.js';
import type { CallerImportRow } from '../types/callers.js';

/** Legacy call list supports offset; agent filtering deliberately selects history. */
export function coreCallList(client: Nixflex, values: Record<string, unknown>) {
  const integer = (key: string) => values[key] === undefined ? undefined : Number(values[key]);
  const params = { limit: integer('limit'), offset: integer('offset') };
  return values.agent ? client.calls.history({ ...params, agent: String(values.agent) }) : client.calls.list(params);
}

/** JSON import keeps null clears/numeric references; CSV remains unchanged. */
export function coreCallerImport(client: Nixflex, number: string | undefined, body: Record<string, unknown>) {
  if (!number || !Array.isArray(body.callers)) throw new Error('callers import <number> --body @callers.json (object with callers array)');
  return client.callers.import(number, body.callers as CallerImportRow[]);
}
