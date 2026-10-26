// Shared, secret-free builders. Keep byte-identical in MCP and CLI.
import { approvedOrigin } from './origins.mjs';
export const SUPPORTED_CLIENTS = Object.freeze(['claude', 'claude-code', 'codex', 'cursor']);
export function buildServerConfig({ client, platform, version, baseUrl, source = 'environment', configFile, profile }) {
  if (!SUPPORTED_CLIENTS.includes(client)) throw new Error('Supported tools: Claude Desktop, Claude Code, Codex and Cursor. VS Code setup is retired.');
  if (!['win32', 'darwin', 'linux'].includes(platform) || (client === 'claude' && platform === 'linux'))
    throw new Error('This client/platform combination is not supported.');
  if (typeof version !== 'string' || version !== version.trim() || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('MCP launch requires a fixed release version.');
  if (!['environment', 'legacy'].includes(source)) throw new Error('Invalid credential source.');
  const origin = approvedOrigin(baseUrl);
  const env = { NIXFLEX_CREDENTIAL_SOURCE: source, NIXFLEX_BASE_URL: origin };
  if (source === 'legacy') {
    if (typeof configFile !== 'string' || !configFile || /[\r\n]/.test(configFile)) throw new Error('Missing credential file path.');
    env.NIXFLEX_CONFIG_FILE = configFile;
    if (profile) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(profile)) throw new Error('Invalid profile name.');
      env.NIXFLEX_PROFILE = profile;
    }
  }
  const entry = platform === 'win32'
    ? { command: 'cmd.exe', args: ['/d', '/s', '/c', 'npx -y nixflex-mcp@' + version], env }
    : { command: 'npx', args: ['-y', 'nixflex-mcp@' + version], env };
  if (source === 'environment' && client === 'cursor') env.NIXFLEX_API_KEY = '${env:NIXFLEX_API_KEY}';
  if (source === 'environment' && client === 'codex') entry.env_vars = ['NIXFLEX_API_KEY'];
  return entry;
}
export function serverName(baseUrl) {
  return approvedOrigin(baseUrl) === 'https://api.nixflex.com' ? 'nixflex' : 'nixflex-staging';
}
export function configSnippet(options) {
  const entry = buildServerConfig(options), name = serverName(options.baseUrl);
  if (options.client !== 'codex') return JSON.stringify({ mcpServers: { [name]: entry } }, null, 2) + '\n';
  const lines = ['[mcp_servers.' + name + ']', 'command = ' + JSON.stringify(entry.command),
    'args = ' + JSON.stringify(entry.args), 'startup_timeout_sec = 30'];
  if (entry.env_vars) lines.push('env_vars = ' + JSON.stringify(entry.env_vars));
  lines.push('', '[mcp_servers.' + name + '.env]');
  for (const [key, value] of Object.entries(entry.env)) lines.push(key + ' = ' + JSON.stringify(value));
  return lines.join('\n') + '\n';
}
