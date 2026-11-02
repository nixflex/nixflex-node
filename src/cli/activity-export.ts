import { open, link, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type Nixflex from '../index.js';
import type { ActivityFilters } from '../resources/organisation.js';

export function activityFilters(body: Record<string, unknown>): ActivityFilters {
  const filters: Record<string, string> = {};
  for (const key of ['from', 'to', 'actor', 'before']) {
    const value = body[key];
    if (value === undefined) continue;
    if (key === 'before' && typeof value === 'number' && Number.isSafeInteger(value)) filters[key] = String(value);
    else if (typeof value === 'string') filters[key] = value;
    else throw new Error('Activity filters must be strings; quote long cursors in a JSON body.');
  }
  return filters;
}
/** Publish the requested file only on a fully completed stream; never overwrite. */
export async function activityExport(c: Nixflex, output: string | undefined, body: Record<string, unknown>) {
  if (!output) throw new Error('Use --output FILE for CSV export. Existing files are never overwritten.');
  const filters = activityFilters(body);
  const partial = output + '.partial-' + randomUUID();
  const file = await open(partial, 'wx', 0o600);
  let bytes = 0;
  try {
    for await (const chunk of c.organisation.activityCsv(filters)) {
      let offset = 0;
      while (offset < chunk.length) {
        const result = await file.write(chunk, offset, chunk.length - offset);
        if (!result.bytesWritten) throw new Error('CSV output could not be written.');
        offset += result.bytesWritten;
      }
      bytes += chunk.length;
    }
    await file.sync();
    await file.close();
    await link(partial, output); // Atomic exclusive publication, including on Windows NTFS.
    return { saved: true, bytes, file: output };
  } finally {
    await file.close().catch(() => {});
    await unlink(partial).catch(() => {});
  }
}
