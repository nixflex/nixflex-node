import { open, link, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
/** Atomic no-overwrite export; a partial file is never reported as a complete download. */
export async function knowledgeOutput(chunks: AsyncIterable<Uint8Array>, output: string | undefined) {
  if (!output) throw new Error('Use --output FILE.json. Existing files are never overwritten.');
  const partial = output + '.partial-' + randomUUID();
  const file = await open(partial, 'wx', 0o600);
  let bytes = 0;
  try {
    for await (const chunk of chunks) {
      let offset = 0;
      while (offset < chunk.length) {
        const written = await file.write(chunk, offset, chunk.length - offset);
        if (!written.bytesWritten) throw new Error('Export file could not be written.');
        offset += written.bytesWritten;
      }
      bytes += chunk.length;
    }
    await file.sync(); await file.close(); await link(partial, output);
    return { saved: true, bytes, file: output, format: 'json-envelope' };
  } finally {
    await file.close().catch(() => {}); await unlink(partial).catch(() => {});
  }
}
