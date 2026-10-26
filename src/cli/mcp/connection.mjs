// Shared installer/runtime policy. Keep byte-identical in MCP and CLI.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { APPROVED_ORIGINS, approvedOrigin } from './origins.mjs';
export { APPROVED_ORIGINS, approvedOrigin } from './origins.mjs';
export function readLegacy(file, read = readFileSync) {
  let raw;
  try { raw = read(file, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('No MCP credentials. Use a full key and explicit API URL in the client environment, or an existing nixflex login file.');
    throw new Error('Cannot read the Nixflex credential file; no fallback was used.');
  }
  let cfg;
  try { cfg = JSON.parse(raw); } catch { throw new Error('Malformed Nixflex credential file; no fallback was used.'); }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg))
    throw new Error('Invalid Nixflex credential file.');
  return cfg;
}
export function resolveConnection({ env = process.env, home = homedir(), read = readFileSync } = {}) {
  const source = env.NIXFLEX_CREDENTIAL_SOURCE || (env.NIXFLEX_API_KEY ? 'environment' : 'legacy');
  if (!['environment', 'legacy'].includes(source)) throw new Error('Invalid MCP credential source.');
  let key, baseUrl, configFile;
  if (source === 'environment') {
    if (env.NIXFLEX_PROFILE) throw new Error('Choose an environment pair or a legacy profile, not both.');
    if (!env.NIXFLEX_BASE_URL) throw new Error('NIXFLEX_BASE_URL is required with an environment key; no production default was used.');
    key = env.NIXFLEX_API_KEY;
    baseUrl = approvedOrigin(env.NIXFLEX_BASE_URL);
  } else {
    configFile = env.NIXFLEX_CONFIG_FILE || join(home, '.nixflex', 'config.json');
    if (!isAbsolute(configFile)) throw new Error('NIXFLEX_CONFIG_FILE must be an absolute path.');
    let cfg = readLegacy(configFile, read);
    if (env.NIXFLEX_PROFILE) {
      const name = env.NIXFLEX_PROFILE;
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name) || !cfg.profiles ||
          !Object.hasOwn(cfg.profiles, name) || !cfg.profiles[name]?.base_url)
        throw new Error('Legacy MCP profile missing or has no explicit API URL; no fallback was used.');
      cfg = cfg.profiles[name];
    }
    key = cfg.api_key;
    baseUrl = approvedOrigin(cfg.base_url === undefined ? APPROVED_ORIGINS[0] : cfg.base_url);
    if (env.NIXFLEX_BASE_URL && approvedOrigin(env.NIXFLEX_BASE_URL) !== baseUrl)
      throw new Error('MCP credential file destination changed or conflicts with this installation; refusing to retarget the key.');
  }
  if (typeof key !== 'string' || !/^nxf_[a-z0-9]+:nxfs_[a-z0-9]+$/i.test(key))
    throw new Error('Missing or invalid full MCP API key. No request was sent.');
  return { key, baseUrl, source, configFile, profile: env.NIXFLEX_PROFILE };
}
