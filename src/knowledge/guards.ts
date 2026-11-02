import type { KnowledgeWriteOptions } from '../types/knowledge.js';
export function writeOptions(opts: KnowledgeWriteOptions): KnowledgeWriteOptions {
  const key = opts?.idempotencyKey;
  if (typeof key !== 'string' || !/^[A-Za-z0-9_.:-]{8,128}$/.test(key) || key.startsWith('prompt:'))
    throw new TypeError('Supply an Idempotency-Key of 8..128 letters, digits, . _ : -, without the reserved prefix.');
  return opts;
}
export function identifier(value: string): string {
  if (typeof value !== 'string' || !value) throw new TypeError('A non-empty knowledge identifier is required.');
  return encodeURIComponent(value);
}
