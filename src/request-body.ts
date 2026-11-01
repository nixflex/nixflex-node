/** Restricted metadata for raw uploads; credentials and destinations are never overridable. */
export interface BodyOptions {
  rawBody?: Uint8Array;
  contentType?: 'application/octet-stream';
  idempotencyKey?: string;
  filename?: string;
  sourceTitle?: string;
  review?: boolean;
  expectedRevision?: number;
}
export function encodeRequest(body: unknown, options: BodyOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.rawBody !== undefined && body !== undefined) throw new TypeError('Use JSON body or rawBody, not both.');
  if (options.contentType && options.contentType !== 'application/octet-stream') throw new TypeError('Unsupported content type.');
  for (const [key, value] of Object.entries({ 'Idempotency-Key': options.idempotencyKey,
    'X-Filename': options.filename, 'X-Source-Title': options.sourceTitle })) {
    if (value === undefined) continue;
    if (typeof value !== 'string' || !value || value.length > 1024 || /[^\x20-\x7e]/.test(value))
      throw new TypeError(`Invalid ${key}; use printable ASCII metadata.`);
    headers[key] = value;
  }
  if (options.review !== undefined) {
    if (typeof options.review !== 'boolean') throw new TypeError('review must be boolean.');
    headers['X-Review'] = String(options.review);
  }
  if (options.expectedRevision !== undefined) {
    if (!Number.isSafeInteger(options.expectedRevision) || options.expectedRevision < 0) throw new TypeError('Invalid expectedRevision.');
    headers['X-Expected-Revision'] = String(options.expectedRevision);
  }
  if (options.rawBody !== undefined) {
    if (!(options.rawBody instanceof Uint8Array)) throw new TypeError('rawBody must be bytes.');
    headers['Content-Type'] = 'application/octet-stream';
    return { headers, body: options.rawBody as BodyInit };
  }
  return { headers, body: body === undefined ? undefined : JSON.stringify(body) };
}
