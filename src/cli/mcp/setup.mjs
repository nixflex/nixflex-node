import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { resolveConnection } from './connection.mjs';
import { buildServerConfig, serverName } from './launch.mjs';
import { writeMcpConfig } from './config-write.mjs';
import release from './release.json' with { type: 'json' };

export async function setupMcp(app, { confirmed = false, localPackage, env = process.env, home = homedir(), platform = process.platform } = {}) {
  if (!['claude', 'cursor'].includes(app))
    throw new Error('Run 1 setup supports claude or cursor. Claude Code/Codex installers arrive in run 3; VS Code is retired.');
  if (Number(process.versions.node.split('.')[0]) < release.minimumNodeMajor) throw new Error('MCP setup requires Node 22 or newer.');
  const connection = resolveConnection({ env, home });
  const entry = buildServerConfig({ client: app, platform, version: release.mcpVersion, ...connection });
  const name = serverName(connection.baseUrl);
  const file = app === 'cursor' ? join(home, '.cursor', 'mcp.json') : platform === 'win32'
    ? join(env.APPDATA || join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
    : join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  if (localPackage) {
    const directory = realpathSync(resolve(localPackage));
    const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    if (pkg.name !== 'nixflex-mcp' || pkg.version !== release.mcpVersion || pkg.bin?.['nixflex-mcp'] !== './index.js' || !statSync(join(directory, 'index.js')).isFile())
      throw new Error('Local MCP package does not match the tested release. Nothing changed.');
    entry.command = process.execPath;
    entry.args = [join(directory, 'index.js')];
  } else if (!release.published) throw new Error('MCP ' + release.mcpVersion + ' is not published yet. Nothing changed. Use --mcp-local with the verified unpacked package (FOUNDATION.md).');
  const result = await writeMcpConfig({ file, name, entry, format: app === 'claude' ? 'json' : 'jsonc',
    display(preview) { process.stderr.write('Proposed MCP change (old values hidden):\n' + JSON.stringify(preview, null, 2) + '\n'); },
    async confirm() {
      if (confirmed) return true;
      if (!process.stdin.isTTY) return false;
      const rl = createInterface({ input: process.stdin, output: process.stderr });
      try { return (await rl.question('Replace only this Nixflex entry? Type yes: ')).trim().toLowerCase() === 'yes'; }
      finally { rl.close(); }
    },
  });
  return { ...result, written: file, server: name, api: connection.baseUrl, credential_source: connection.source,
    note: 'Fully quit and reopen the client. No key was written into its configuration.' };
}
