import type Nixflex from '../index.js';
import { knowledgePlan } from './knowledge-plan.js';
import { knowledgeOutput } from './knowledge-output.js';
import { NixflexError, NixflexOutcomeUnknownError } from '../errors.js';
const safeCodes = new Set(['invalid_input','invalid_filter','not_found','unauthorized','permission_denied',
  'stale_revision','knowledge_missing','session_closed','target_changed','knowledge_disabled','busy',
  'idempotency_conflict','export_expired','source_limit','unavailable','retry_unavailable']);
export const knowledgeFlags = {
  file: { type: 'string' }, filename: { type: 'string' }, 'source-title': { type: 'string' },
  'idempotency-key': { type: 'string' }, review: { type: 'string' },
  'expected-revision': { type: 'string' },
} as const;
type Values = Record<string, unknown>;
/** Every new POST/change is confirmed before calling any SDK method. No request-content logging. */
export async function knowledgeCommand(c: Nixflex, positions: string[], values: Values,
  body: Record<string, unknown>, confirmed: boolean) {
  const [, name, ...ids] = positions;
  const operation = knowledgePlan.find(row => row.name === name);
  const file = ['uploadSource', 'replaceSourceFile', 'measureFile'].includes(name);
  if (!operation && !file && name !== 'waitJob') throw new Error('Unknown knowledge command. Run nixflex --help.');
  if ((file || operation?.method !== 'GET' && name !== 'waitJob') && !confirmed)
    return { confirmation_required: true, sent: false, hint: 'No request sent. Review the action, then add --confirm.' };
  const options: Record<string, unknown> = {};
  if (values['idempotency-key'] !== undefined) options.idempotencyKey = values['idempotency-key'];
  if (values.timeout !== undefined) {
    const timeout = Number(values.timeout);
    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 300) throw new Error('Timeout must be 0..300 seconds.');
    options.timeoutMs = timeout * 1000;
  }
  const api = c.knowledge as unknown as Record<string, (...args: any[]) => any>;
  try {
    if (name === 'waitJob') {
      if (ids.length !== 1) throw new TypeError('Supply one job ID.');
      return await c.knowledge.waitJob(ids[0], { timeoutMs: options.timeoutMs as number | undefined });
    }
    if (file) {
      const count = name === 'replaceSourceFile' ? 2 : 1;
      if (ids.length !== count || typeof values.file !== 'string') throw new TypeError('Supply identifiers and --file FILE.');
      if (values.review !== undefined) {
        if (!['true', 'false'].includes(String(values.review))) throw new TypeError('Review must be true or false.');
        options.review = values.review === 'true';
      }
      if (values['expected-revision'] !== undefined) options.expectedRevision = Number(values['expected-revision']);
      if (values.filename !== undefined) options.filename = values.filename;
      if (values['source-title'] !== undefined) options.sourceTitle = values['source-title'];
      return await api[name](...ids, values.file, options);
    }
    if (!operation || ids.length !== operation.params.length) throw new TypeError('Supply the required knowledge identifiers.');
    const args: unknown[] = [...ids];
    if (operation.body || operation.query) args.push(body);
    args.push(options);
    if (name === 'downloadExport')
      return await knowledgeOutput(api[name](...args), values.output as string | undefined);
    const result = await api[name](...args);
    if (values.wait === true && result?.id && typeof result.state === 'string')
      return await c.knowledge.waitJob(result.id, { timeoutMs: options.timeoutMs as number | undefined });
    return result;
  } catch (error) {
    const e = error as { name?: string; status?: number; code?: string; safe_to_retry?: boolean };
    // Never repeat arbitrary API messages/fields which might contain customer content.
    const status = Number.isInteger(e.status) && e.status! >= 0 && e.status! <= 599 ? e.status : 0;
    const code = e.code === 'outcome_unknown' ? 'outcome_unknown' : safeCodes.has(e.code || '') ? e.code! : 'knowledge_request_failed';
    const unknown = code === 'outcome_unknown';
    if (unknown) throw new NixflexOutcomeUnknownError(status);
    throw new NixflexError(status || 0, { error: { type: 'request_failed', code,
      message: 'Knowledge request failed. Check identifiers, input, revision and operation key.' } });
  }
}
