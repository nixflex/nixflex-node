// Pure policy: safe to reuse in dashboard snippet generation (no Node imports).
export const APPROVED_ORIGINS = Object.freeze([
  'https://api.nixflex.com',
  'https://nixflex-voice-engine-staging.up.railway.app',
]);
export function approvedOrigin(value) {
  if (typeof value !== 'string' || value !== value.trim() || /[\\\s]/.test(value))
    throw new Error('MCP API destination must be an approved HTTPS Nixflex origin.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid MCP API destination.'); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      !APPROVED_ORIGINS.includes(url.origin))
    throw new Error('MCP API destination must be an approved HTTPS Nixflex origin.');
  return url.origin;
}
