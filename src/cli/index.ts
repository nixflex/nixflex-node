// ============================================
// src/cli/index.ts - the `nixflex` command.
//
//   npx nixflex login                      store your key in ~/.nixflex/config.json
//   nixflex agents list --json             every command takes --json
//   nixflex calls create --agent agent_x --to +44... --prompt "..."
//   nixflex callers set +44BUSINESS +44CALLER --name "Sam Carter" --email sam@x.com
//   nixflex callers import +44BUSINESS ./customers.csv
//   nixflex mcp setup claude               write the MCP server config for Claude Desktop
//
// ONE DOOR: every command calls the SDK (../index.js). The CLI never speaks HTTP itself,
// so it cannot drift from the API - when the SDK gains a method, the CLI gains a command.
// ZERO DEPENDENCIES: node:util parseArgs, node:fs, node:os. Nothing to audit, nothing to
// break on install. Node >= 18 (same as the SDK).
// KEY RESOLUTION: --key flag > NIXFLEX_API_KEY env > ~/.nixflex/config.json. A key never
// touches the command line in examples; `login` reads it from a prompt or the env.
// ============================================
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import Nixflex, { NixflexError } from '../index.js';

declare const __CLI_VERSION__: string | undefined;
const VERSION = typeof __CLI_VERSION__ === 'string' ? __CLI_VERSION__ : '0.0.0';
const CONFIG_DIR = join(homedir(), '.nixflex');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// ---------- config ----------
function readConfig(): { api_key?: string; base_url?: string } {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
function writeConfig(cfg: Record<string, unknown>): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 });
}
function resolveKey(flagKey?: string): string {
  const key = flagKey || process.env.NIXFLEX_API_KEY || readConfig().api_key;
  if (!key) fail('No API key. Run `nixflex login`, or set NIXFLEX_API_KEY.', 2);
  if (!/^nxf_[a-z0-9]+:nxfs_[a-z0-9]+$/i.test(key)) fail('The key must be the full pair: nxf_xxx:nxfs_xxx (key id, colon, secret).', 2);
  return key;
}
function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Mute the echo so the secret is not left in the terminal scrollback.
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => { if (s.includes(question)) out.output.write(question); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

// ---------- output ----------
let JSON_MODE = false;
function out(data: unknown): void {
  if (JSON_MODE) { process.stdout.write(JSON.stringify(data, null, 2) + '\n'); return; }
  if (Array.isArray(data)) { table(data); return; }
  if (data && typeof data === 'object') { kv(data as Record<string, unknown>); return; }
  process.stdout.write(String(data) + '\n');
}
function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
function table(rows: unknown[]): void {
  if (rows.length === 0) { process.stdout.write('(none)\n'); return; }
  const objs = rows.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  const cols = Array.from(new Set(objs.flatMap((r) => Object.keys(r)))).filter((c) => !/^(system_prompt|sms_prompt|web_prompt|transcript|custom_prompt)$/.test(c)).slice(0, 8);
  const widths = cols.map((c) => Math.min(40, Math.max(c.length, ...objs.map((r) => cell(r[c]).length))));
  const line = (vals: string[]) => vals.map((v, i) => v.slice(0, widths[i]).padEnd(widths[i])).join('  ') + '\n';
  process.stdout.write(line(cols.map((c) => c.toUpperCase())));
  for (const r of objs) process.stdout.write(line(cols.map((c) => cell(r[c]))));
}
function kv(o: Record<string, unknown>): void {
  const w = Math.max(...Object.keys(o).map((k) => k.length));
  for (const [k, v] of Object.entries(o)) process.stdout.write(k.padEnd(w) + '  ' + cell(v) + '\n');
}
function fail(msg: string, code = 1): never {
  process.stderr.write('error: ' + msg + '\n');
  process.exit(code);
}

// ---------- csv (import) ----------
// Minimal RFC-4180 reader: quotes, escaped quotes, commas inside quotes, CRLF. Header row
// names the fields - caller_number plus any caller-context field. No dependency.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!head) return [];
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// ---------- help ----------
const HELP = `nixflex ${VERSION} - the Nixflex voice AI platform from your terminal

USAGE  nixflex <group> <command> [args] [--json] [--key KEY]

ACCOUNT
  login                         store your API key (prompt, or NIXFLEX_API_KEY)
  logout                        remove the stored key
  whoami                        show which key is in use and the account balance
  usage                         usage and balance
  doctor                        check key, connectivity and version

AGENTS
  agents list [--limit N]
  agents get <agent_id>
  agents create --name NAME --prompt TEXT|@file [--voice ID] [--language xx]
  agents update <agent_id> [--name] [--prompt] [--voice] [--language] [--incall-sms true|false]
  agents delete <agent_id> --confirm

CALLS
  calls create --agent ID --to +44... --prompt TEXT|@file [--from +44...] [--var key=value ...]
  calls list [--limit N] [--agent ID]
  calls get <call_id>

NUMBERS
  numbers list [--agent ID]
  numbers update <number> [--sms-reply true|false] [--sms-prompt TEXT|@file] [--dtmf true|false|null]

CALLERS  (caller context - what the agent knows about a caller on one of your numbers)
  callers get <your_number> <caller_number>
  callers set <your_number> <caller_number> [--name] [--email] [--phone] [--location] [--reference] [--preference]
                                           (pass --email null to remove a field)
  callers import <your_number> <file.csv>  columns: caller_number,name,email,phone,location,reference_id,preference
  callers delete <your_number> <caller_number> --confirm

SMS
  sms send --agent ID --from +44... --to +44... --message TEXT

MCP
  mcp setup <claude|cursor|vscode>  write the Nixflex MCP server into that app's config

Every command accepts --json. Docs: https://docs.nixflex.com/cli
`;

// ---------- helpers ----------
function textOrFile(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v.startsWith('@')) return readFileSync(v.slice(1), 'utf8');
  return v;
}
function boolOrNull(v: string | undefined): boolean | null | undefined {
  if (v === undefined) return undefined;
  if (v === 'true') return true; if (v === 'false') return false; if (v === 'null') return null;
  fail('expected true, false or null, got ' + v);
}
function nullable(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  return v === 'null' ? null : v;
}
function vars(list: string[] | undefined): Record<string, string> | undefined {
  if (!list || list.length === 0) return undefined;
  const o: Record<string, string> = {};
  for (const kv of list) { const i = kv.indexOf('='); if (i < 1) fail('--var expects key=value, got ' + kv); o[kv.slice(0, i)] = kv.slice(i + 1); }
  return o;
}

// ---------- mcp setup ----------
function mcpSetup(app: string): void {
  const home = homedir();
  const entry = { command: 'npx', args: ['-y', 'nixflex-mcp'], env: { NIXFLEX_API_KEY: '${NIXFLEX_API_KEY}' } };
  let file: string; let root: string;
  if (app === 'claude') {
    file = process.platform === 'win32' ? join(process.env.APPDATA || home, 'Claude', 'claude_desktop_config.json')
      : process.platform === 'darwin' ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : join(home, '.config', 'Claude', 'claude_desktop_config.json');
    root = 'mcpServers';
  } else if (app === 'cursor') { file = join(home, '.cursor', 'mcp.json'); root = 'mcpServers'; }
  else if (app === 'vscode') { file = join(process.cwd(), '.vscode', 'mcp.json'); root = 'servers'; }
  else fail('mcp setup expects claude, cursor or vscode');
  let cfg: Record<string, unknown> = {};
  try { cfg = JSON.parse(readFileSync(file, 'utf8')); } catch { /* new file */ }
  const servers = (cfg[root] as Record<string, unknown>) || {};
  servers['nixflex'] = entry;
  cfg[root] = servers;
  const dir = join(file, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  out({ written: file, server: 'nixflex', note: 'Set NIXFLEX_API_KEY in your environment, then restart ' + app + '.' });
}

// ---------- main ----------
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2), allowPositionals: true, strict: false,
    options: {
      json: { type: 'boolean' }, key: { type: 'string' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
      confirm: { type: 'boolean' }, limit: { type: 'string' },
      name: { type: 'string' }, prompt: { type: 'string' }, voice: { type: 'string' }, language: { type: 'string' }, 'incall-sms': { type: 'string' },
      agent: { type: 'string' }, to: { type: 'string' }, from: { type: 'string' }, var: { type: 'string', multiple: true }, message: { type: 'string' },
      'sms-reply': { type: 'string' }, 'sms-prompt': { type: 'string' }, dtmf: { type: 'string' },
      email: { type: 'string' }, phone: { type: 'string' }, location: { type: 'string' }, reference: { type: 'string' }, preference: { type: 'string' },
    },
  });
  JSON_MODE = !!values.json;
  const [group, cmd, a1, a2] = positionals as string[];
  if (values.version) { process.stdout.write(VERSION + '\n'); return; }
  if (!group || values.help) { process.stdout.write(HELP); return; }
  const s = (k: string) => values[k] as string | undefined;

  // --- account (no key needed for login/logout) ---
  if (group === 'login') {
    const key = process.env.NIXFLEX_API_KEY || await ask('API key (nxf_xxx:nxfs_xxx): ', true);
    if (!/^nxf_[a-z0-9]+:nxfs_[a-z0-9]+$/i.test(key)) fail('That is not a full key pair (nxf_xxx:nxfs_xxx).');
    await new Nixflex({ apiKey: key }).usage.get().catch((e: Error) => fail('Key rejected: ' + e.message));
    writeConfig({ ...readConfig(), api_key: key });
    out({ logged_in: true, key_id: key.split(':')[0], config: CONFIG_FILE });
    return;
  }
  if (group === 'logout') { const c = readConfig(); delete c.api_key; writeConfig(c); out({ logged_out: true }); return; }
  if (group === 'mcp') { if (cmd !== 'setup') fail('usage: nixflex mcp setup <claude|cursor|vscode>'); mcpSetup(a1); return; }

  // Unknown commands fail BEFORE any key is needed - a typo must not read as 'not logged in'.
  if (!['whoami', 'usage', 'doctor', 'agents', 'calls', 'numbers', 'callers', 'sms'].includes(group)) fail('unknown command "' + group + '". Run `nixflex --help`.');
  const client = new Nixflex({ apiKey: resolveKey(s('key')), baseUrl: readConfig().base_url });
  const limit = s('limit') ? parseInt(s('limit') as string, 10) : undefined;

  if (group === 'whoami') { const u = await client.usage.get(); out({ key_id: resolveKey(s('key')).split(':')[0], ...u }); return; }
  if (group === 'usage') { out(await client.usage.get()); return; }
  if (group === 'doctor') {
    const checks: Record<string, unknown> = { version: VERSION, node: process.version, key_source: s('key') ? '--key' : process.env.NIXFLEX_API_KEY ? 'env' : 'config' };
    try { const t = Date.now(); await client.usage.get(); checks.api = 'ok (' + (Date.now() - t) + 'ms)'; } catch (e) { checks.api = 'FAILED: ' + (e as Error).message; }
    out(checks); return;
  }

  // --- agents ---
  if (group === 'agents') {
    if (cmd === 'list') { out(await client.agents.list(limit ? { limit } : {})); return; }
    if (cmd === 'get') { if (!a1) fail('agents get <agent_id>'); out(await client.agents.get(a1)); return; }
    if (cmd === 'create') {
      if (!s('name') || !s('prompt')) fail('agents create --name NAME --prompt TEXT|@file');
      const body: Record<string, unknown> = { name: s('name'), system_prompt: textOrFile(s('prompt')) };
      if (s('voice')) body.voice_id = s('voice'); if (s('language')) body.language = s('language');
      out(await client.agents.create(body as never)); return;
    }
    if (cmd === 'update') {
      if (!a1) fail('agents update <agent_id> [--name] [--prompt] [--voice] [--language] [--incall-sms]');
      const body: Record<string, unknown> = {};
      if (s('name')) body.name = s('name'); if (s('prompt')) body.system_prompt = textOrFile(s('prompt'));
      if (s('voice')) body.voice_id = s('voice'); if (s('language')) body.language = s('language');
      const ic = boolOrNull(s('incall-sms')); if (ic !== undefined) body.incall_sms_enabled = ic;
      if (Object.keys(body).length === 0) fail('nothing to update - pass at least one flag');
      out(await client.agents.update(a1, body as never)); return;
    }
    if (cmd === 'delete') {
      if (!a1) fail('agents delete <agent_id> --confirm');
      if (!values.confirm) { const ag = await client.agents.get(a1); out({ would_delete: (ag as { name?: string }).name, agent_id: a1, hint: 'add --confirm to delete' }); return; }
      out(await client.agents.delete(a1)); return;
    }
    fail('agents: list | get | create | update | delete');
  }

  // --- calls ---
  if (group === 'calls') {
    if (cmd === 'create') {
      if (!s('agent') || !s('to') || !s('prompt')) fail('calls create --agent ID --to +44... --prompt TEXT|@file [--from +44...] [--var k=v]');
      const body: Record<string, unknown> = { agent_id: s('agent'), to_number: s('to'), prompt: textOrFile(s('prompt')) };
      if (s('from')) body.from_number = s('from'); const v = vars(values.var as string[] | undefined); if (v) body.variables = v;
      out(await client.calls.create(body as never)); return;
    }
    if (cmd === 'list') { const q: Record<string, unknown> = {}; if (limit) q.limit = limit; if (s('agent')) q.agent_id = s('agent'); out(await client.calls.list(q as never)); return; }
    if (cmd === 'get') { if (!a1) fail('calls get <call_id>'); out(await client.calls.get(a1)); return; }
    fail('calls: create | list | get');
  }

  // --- numbers ---
  if (group === 'numbers') {
    if (cmd === 'list') { const r = await client.phoneNumbers.list(s('agent') ? { agent_id: s('agent') } : {}); out(JSON_MODE ? r : (r as { phone_numbers: unknown[] }).phone_numbers); return; }
    if (cmd === 'update') {
      if (!a1) fail('numbers update <number> [--sms-reply] [--sms-prompt] [--dtmf]');
      const body: Record<string, unknown> = {};
      const sr = boolOrNull(s('sms-reply')); if (sr !== undefined) body.sms_reply_enabled = sr;
      if (s('sms-prompt') !== undefined) body.sms_prompt = nullable(textOrFile(s('sms-prompt')));
      const d = boolOrNull(s('dtmf')); if (d !== undefined) body.dtmf_enabled = d;
      if (Object.keys(body).length === 0) fail('nothing to update - pass at least one flag');
      out(await client.phoneNumbers.update(a1, body as never)); return;
    }
    fail('numbers: list | update');
  }

  // --- callers (caller context) ---
  if (group === 'callers') {
    if (cmd === 'get') { if (!a1 || !a2) fail('callers get <your_number> <caller_number>'); const r = await client.callers.get(a1, a2); out(JSON_MODE ? r : r.caller.context); return; }
    if (cmd === 'set') {
      if (!a1 || !a2) fail('callers set <your_number> <caller_number> --name ... --email ...');
      const body: Record<string, unknown> = {};
      for (const [flag, field] of [['name', 'name'], ['email', 'email'], ['phone', 'phone'], ['location', 'location'], ['reference', 'reference_id'], ['preference', 'preference']]) {
        const v = nullable(s(flag)); if (v !== undefined) body[field] = v;
      }
      if (Object.keys(body).length === 0) fail('nothing to set - pass at least one of --name --email --phone --location --reference --preference');
      const r = await client.callers.set(a1, a2, body as never); out(JSON_MODE ? r : r.caller.context); return;
    }
    if (cmd === 'import') {
      if (!a1 || !a2) fail('callers import <your_number> <file.csv>');
      const rows = parseCsv(readFileSync(a2, 'utf8'));
      if (rows.length === 0) fail('no rows in ' + a2);
      if (!('caller_number' in rows[0])) fail('the CSV needs a caller_number column');
      let imported = 0;
      for (let i = 0; i < rows.length; i += 1000) {
        const chunk = rows.slice(i, i + 1000).map((r) => { const o: Record<string, string> = {}; for (const [k, v] of Object.entries(r)) if (v !== '') o[k] = v; return o; });
        const r = await client.callers.import(a1, chunk as never); imported += r.imported;
      }
      out({ phone_number: a1, imported, rows: rows.length }); return;
    }
    if (cmd === 'delete') {
      if (!a1 || !a2) fail('callers delete <your_number> <caller_number> --confirm');
      if (!values.confirm) { const r = await client.callers.get(a1, a2); out({ would_delete: r.caller.context, hint: 'add --confirm to delete' }); return; }
      out(await client.callers.delete(a1, a2)); return;
    }
    fail('callers: get | set | import | delete');
  }

  // --- sms ---
  if (group === 'sms') {
    if (cmd === 'send') {
      if (!s('agent') || !s('from') || !s('to') || !s('message')) fail('sms send --agent ID --from +44... --to +44... --message TEXT');
      out(await client.sms.send({ agent_id: s('agent'), from_number: s('from'), to: s('to'), message: s('message') } as never)); return;
    }
    fail('sms: send');
  }

  fail('unknown command "' + group + '". Run `nixflex --help`.');
}

main().catch((e: unknown) => {
  if (e instanceof NixflexError) {
    if (JSON_MODE) process.stdout.write(JSON.stringify({ error: { code: e.code, status: e.status, message: e.message, doc_url: e.docUrl } }, null, 2) + '\n');
    else process.stderr.write('error ' + (e.status || '') + ' ' + (e.code || '') + ': ' + e.message + (e.docUrl ? '\n  ' + e.docUrl : '') + '\n');
    // exitCode, not exit(): exit() before stdout has flushed crashes Node on Windows (UV_HANDLE_CLOSING).
    process.exitCode = 1;
    return;
  }
  fail((e as Error).message);
});
