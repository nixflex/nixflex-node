// ============================================
// src/webhook-verify.ts
// Verifies Nixflex webhook signatures. The engine signs every delivery:
//   header  X-Nixflex-Signature: t=<unix_ts>,v1=<hmac_sha256_hex>
//   payload "<timestamp>.<raw_body>"   secret: your key_secret
// (Scheme verified against the live engine, Aug 2026.)
// Use the RAW request body BYTES - a re-serialized JSON.stringify(body) may
// differ from what was signed and will fail verification.
// ============================================
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyOptions {
  /** Max allowed age of the signature in seconds (replay protection). Default 300. */
  toleranceSeconds?: number;
  /** Override "now" (unix seconds) - for testing. */
  now?: number;
}

/** Returns true only if the signature is authentic AND fresh. Never throws. */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  keySecret: string,
  options: VerifyOptions = {}
): boolean {
  try {
    if (!signatureHeader || !keySecret) return false;
    const parts: Record<string, string> = {};
    for (const seg of signatureHeader.split(',')) {
      const i = seg.indexOf('=');
      if (i > 0) parts[seg.slice(0, i).trim()] = seg.slice(i + 1).trim();
    }
    const t = parseInt(parts['t'] || '', 10);
    const v1 = parts['v1'] || '';
    if (!isFinite(t) || !/^[0-9a-f]{64}$/.test(v1)) return false;

    const tolerance = options.toleranceSeconds ?? 300;
    const now = options.now ?? Math.floor(Date.now() / 1000);
    if (Math.abs(now - t) > tolerance) return false; // stale or future-dated = replay risk

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha256', keySecret).update(t + '.' + body).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b); // constant-time - no timing side channel
  } catch {
    return false;
  }
}
