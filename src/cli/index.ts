// ============================================
// src/cli/index.ts - the `nixflex` command.
//
//   npx nixflex login                       store your key in ~/.nixflex/config.json
//   nixflex agents list --json              every command takes --json
//   nixflex agents update agent_x --set silence_hangup_seconds=12 --set incall_sms_enabled=true
//   nixflex calls create --agent agent_x --to +44... --prompt @call.txt --wait
//   nixflex campaigns create --agent agent_x --from +44... --prompt @p.txt --csv people.csv
//   nixflex callers import +44BUSINESS ./customers.csv
//   nixflex mcp setup claude
//
// ONE DOOR: every command calls the SDK (../index.js). The CLI never speaks HTTP itself,
// so it cannot drift from the API. tests/cli.test.cjs fails if an SDK method has no
// command, so the CLI cannot fall behind the SDK either.
// NEVER-UPDATE-AGAIN RULE: every create/update/set accepts --set field=value (repeatable;
// true/false/null/numbers parsed, @file reads a file) and --body @file.json for nested
// objects. A new API field needs NO CLI change - named flags exist only for the common
// cases. That is the whole reason this file can stay still for a year.
// ZERO DEPENDENCIES: node:util parseArgs, node:fs, node:os. Node >= 18 (same as the SDK).
// STREAMS: data to stdout, progress + errors to stderr - scripts can pipe stdout safely.
// KEY RESOLUTION: --key flag > NIXFLEX_API_KEY env > ~/.nixflex/config.json.
// DESTRUCTIVE COMMANDS: preview and stop unless --confirm (alias --yes) is given.
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
const KEY_RE = /^nxf_[a-z0-9]+:nxfs_[a-z0-9]+$/i;
function resolveKey(flagKey?: string): string {
  const key = flagKey || process.env.NIXFLEX_API_KEY || readConfig().api_key;
  if (!key) fail('No API key. Run `nixflex login`, or set NIXFLEX_API_KEY.', 2);
  if (!KEY_RE.test(key)) fail('The key must be the full pair: nxf_xxx:nxfs_xxx (key id, colon, secret).', 2);
  return key;
}
function ask(question: string): Promise<string> {
  // Visible prompt on purpose: a muted readline drops pasted input on Windows consoles.
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

// ---------- output ----------
let JSON_MODE = false;
const HIDE = /^(system_prompt|sms_prompt|web_prompt|transcript|custom_prompt|recording_url|api_key_id)$/;
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
  if (objs.length === 0) { for (const r of rows) process.stdout.write(cell(r) + '\n'); return; }
  const cols = Array.from(new Set(objs.flatMap((r) => Object.keys(r)))).filter((c) => !HIDE.test(c)).slice(0, 8);
  const widths = cols.map((c) => Math.min(40, Math.max(c.length, ...objs.map((r) => cell(r[c]).length))));
  const line = (vals: string[]) => vals.map((v, i) => v.slice(0, widths[i]).padEnd(widths[i])).join('  ') + '\n';
  process.stdout.write(line(cols.map((c) => c.toUpperCase())));
  for (const r of objs) process.stdout.write(line(cols.map((c) => cell(r[c]))));
}
function kv(o: Record<string, unknown>): void {
  const keys = Object.keys(o);
  if (keys.length === 0) { process.stdout.write('{}\n'); return; }
  const w = Math.max(...keys.map((k) => k.length));
  for (const [k, v] of Object.entries(o)) process.stdout.write(k.padEnd(w) + '  ' + cell(v) + '\n');
}
function note(msg: string): void { process.stderr.write(msg + '\n'); }
function fail(msg: string, code = 1): never {
  process.stderr.write('error: ' + msg + '\n');
  process.exit(code);
}

// ---------- value parsing ----------
function textOrFile(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v.startsWith('@')) return readFileSync(v.slice(1), 'utf8');
  return v;
}
function parseValue(raw: string): unknown {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (raw.startsWith('@')) return readFileSync(raw.slice(1), 'utf8');
  if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) { try { return JSON.parse(raw); } catch { /* keep as text */ } }
  return raw;
}
// --set a=1 --set b=x --body @file.json  ->  one object. --set wins over --body on the same key.
function bodyFrom(values: Record<string, unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const b = values.body as string | undefined;
  if (b) {
    const text = b === '-' ? readFileSync(0, 'utf8') : textOrFile(b) || '';
    try { Object.assign(body, JSON.parse(text)); } catch { fail('--body must be JSON (a file with @path, or - for stdin)'); }
  }
  for (const kv of (values.set as string[] | undefined) || []) {
    const i = kv.indexOf('=');
    if (i < 1) fail('--set expects field=value, got ' + kv);
    body[kv.slice(0, i)] = parseValue(kv.slice(i + 1));
  }
  for (const [k, v] of Object.entries(extra)) if (v !== undefined) body[k] = v;
  return body;
}
function boolOrNull(v: string | undefined): boolean | null | undefined {
  if (v === undefined) return undefined;
  if (v === 'true') return true; if (v === 'false') return false; if (v === 'null') return null;
  fail('expected true, false or null, got ' + v);
}
function vars(list: string[] | undefined): Record<string, string> | undefined {
  if (!list || list.length === 0) return undefined;
  const o: Record<string, string> = {};
  for (const kv of list) { const i = kv.indexOf('='); if (i < 1) fail('--var expects key=value, got ' + kv); o[kv.slice(0, i)] = kv.slice(i + 1); }
  return o;
}

// ---------- csv ----------
// Minimal RFC-4180 reader: quotes, escaped quotes, commas inside quotes, CRLF, BOM. No dependency.
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
  const keys = head.map((h) => h.trim().replace(/^\uFEFF/, ''));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}
// CSV -> campaign recipients: `phone` column required, `prompt_override` optional (voice
// only), every other column becomes a variable for that recipient.
function recipientsFromCsv(file: string, allowOverride: boolean): Record<string, unknown>[] {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (rows.length === 0) fail('no rows in ' + file);
  if (!('phone' in rows[0])) fail('the CSV needs a `phone` column (E.164, e.g. +447700900123)');
  return rows.map((r) => {
    const rec: Record<string, unknown> = { phone: r.phone };
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(r)) {
      if (k === 'phone' || val === '') continue;
      if (k === 'prompt_override' && allowOverride) { rec.prompt_override = val; continue; }
      v[k] = val;
    }
    if (Object.keys(v).length) rec.variables = v;
    return rec;
  });
}

// ---------- help ----------
const GROUPS = ['login', 'logout', 'whoami', 'usage', 'doctor', 'completion', 'mcp', 'agents', 'calls', 'campaigns', 'numbers', 'callers', 'sms', 'webhooks', 'keys', 'storage', 'llm', 'tts'];
const HELP = `nixflex ${VERSION} - the Nixflex voice AI platform from your terminal

USAGE  nixflex <group> <command> [args] [--json] [--key KEY] [--base-url URL]

EXAMPLES
  nixflex login
  nixflex agents update agent_x --set silence_hangup_seconds=12
  nixflex calls create --agent agent_x --to +447700900123 --prompt @call.txt --wait
  nixflex callers import +447450307843 ./customers.csv

ACCOUNT
  login                          store your API key (prompt, or NIXFLEX_API_KEY)
  logout                         remove the stored key
  whoami                         key in use, usage and balance
  usage                          usage and balance
  doctor                         check key, connectivity and version
  completion <bash|zsh|pwsh>     print a shell completion script
  keys rotate --confirm          new secret; the old one stops working immediately

AGENTS
  agents list [--limit N]
  agents get <agent_id>
  agents create --name NAME --prompt TEXT|@file [--voice ID] [--language xx] [--set k=v ...]
  agents update <id> [--name] [--prompt] [--voice] [--language] [--incall-sms true|false] [--set k=v ...]
  agents delete <id> --confirm

CALLS
  calls create --agent ID --to +44... --prompt TEXT|@file [--from +44...] [--var k=v ...] [--wait] [--timeout S]
  calls list [--limit N] [--agent ID]
  calls get <call_id>
  calls delete <call_id> --confirm
  calls delete-all --confirm       every call and recording on the account

CAMPAIGNS (voice batch)
  campaigns create --agent ID --from +44... --prompt TEXT|@file --csv people.csv [--name] [--set k=v ...]
                   CSV: phone (required), prompt_override (optional), any other column = variable
  campaigns launch <campaign_id>

NUMBERS
  numbers list [--agent ID]
  numbers import --set phone_number=+44... --set agent_id=ID --set twilio_account_sid=... --set twilio_auth_token=...
                 (or --set telnyx_api_key=... --set telnyx_connection_id=...)   or --body @number.json
  numbers update <number> [--sms-reply] [--sms-prompt] [--dtmf] [--set k=v ...]
  numbers delete <number> --confirm
  numbers monitor <number> [get|on|off]
  numbers web-calls <number> [get|on|off]

CALLERS (caller context)
  callers get <your_number> <caller_number>
  callers set <your_number> <caller_number> [--name] [--email] [--phone] [--location] [--reference] [--preference]
  callers import <your_number> <file.csv>   columns: caller_number, name, email, phone, location, reference_id, preference
  callers delete <your_number> <caller_number> --confirm

SMS
  sms send --agent ID --from +44... --to +44... --message TEXT
  sms campaigns create --agent ID --from +44... --message TEXT|@file --csv people.csv [--set k=v ...]
  sms campaigns launch <id>
  sms campaigns list [--status S] [--limit N]
  sms campaigns get <id>
  sms campaigns delete <id> --confirm

WEBHOOKS (per number)
  webhooks set <number> <url> [--slot 1|2]
  webhooks get <number> [--slot 1|2]
  webhooks delete <number> [--slot 1|2] --confirm

BRING YOUR OWN
  storage set --set k=v ...      storage get      storage delete --confirm
  llm set --set k=v ...          llm get          llm delete --confirm
  tts set --set k=v ...          tts get          tts delete --confirm

MCP
  mcp setup <claude|cursor|vscode>   connect the Nixflex MCP server to that app

FLAGS   --json machine output   --set field=value (repeat)   --body @file.json | -   --confirm / --yes
EXIT    0 ok   1 error   2 no API key
Docs: https://docs.nixflex.com/cli
`;

// ---------- did you mean ----------
function closest(word: string, options: string[]): string | null {
  const dist = (a: string, b: string): number => {
    const m: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...(Array(b.length).fill(0) as number[])]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  };
  let best: string | null = null; let bd = 3;
  for (const o of options) { const d = dist(word, o); if (d < bd) { bd = d; best = o; } }
  return best;
}

// ---------- completion ----------
function completion(shell: string): string {
  const words = GROUPS.join(' ');
  if (shell === 'bash') return `_nixflex() { COMPREPLY=($(compgen -W "${words}" -- "\${COMP_WORDS[COMP_CWORD]}")); }\ncomplete -F _nixflex nixflex\n`;
  if (shell === 'zsh') return `#compdef nixflex\n_arguments "1: :(${words})"\n`;
  if (shell === 'pwsh') return `Register-ArgumentCompleter -Native -CommandName nixflex -ScriptBlock { param($wordToComplete) '${GROUPS.join("','")}' | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }\n`;
  fail('completion expects bash, zsh or pwsh');
}

// ---------- mcp setup ----------
function mcpSetup(app: string): void {
  const home = homedir();
  // Desktop apps do NOT expand \${VAR} in their config. The MCP server reads
  // ~/.nixflex/config.json itself, so after `nixflex login` no env block is needed; only
  // when the key exists solely in the environment do we write its real value.
  const stored = readConfig().api_key;
  const entry: Record<string, unknown> = { command: 'npx', args: ['-y', 'nixflex-mcp'] };
  if (!stored && process.env.NIXFLEX_API_KEY) entry.env = { NIXFLEX_API_KEY: process.env.NIXFLEX_API_KEY };
  if (!stored && !process.env.NIXFLEX_API_KEY) fail("Run 'nixflex login' first so the MCP server can find your key.");
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
  out({ written: file, server: 'nixflex', key: stored ? 'from ~/.nixflex/config.json' : 'written into the config env', note: 'Fully quit and reopen ' + app + '.' });
}

// ---------- main ----------
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2), allowPositionals: true, strict: false,
    options: {
      json: { type: 'boolean' }, key: { type: 'string' }, 'base-url': { type: 'string' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
      confirm: { type: 'boolean' }, yes: { type: 'boolean', short: 'y' }, limit: { type: 'string' }, status: { type: 'string' },
      set: { type: 'string', multiple: true }, body: { type: 'string' },
      name: { type: 'string' }, prompt: { type: 'string' }, voice: { type: 'string' }, language: { type: 'string' }, 'incall-sms': { type: 'string' },
      agent: { type: 'string' }, to: { type: 'string' }, from: { type: 'string' }, var: { type: 'string', multiple: true }, message: { type: 'string' },
      wait: { type: 'boolean' }, timeout: { type: 'string' }, csv: { type: 'string' }, slot: { type: 'string' },
      'sms-reply': { type: 'string' }, 'sms-prompt': { type: 'string' }, dtmf: { type: 'string' },
      email: { type: 'string' }, phone: { type: 'string' }, location: { type: 'string' }, reference: { type: 'string' }, preference: { type: 'string' },
    },
  });
  JSON_MODE = !!values.json;
  const confirmed = !!(values.confirm || values.yes);
  const [group, cmd, a1, a2] = positionals as string[];
  const s = (k: string) => values[k] as string | undefined;
  if (values.version) { process.stdout.write(VERSION + '\n'); return; }
  if (!group || values.help) { process.stdout.write(HELP); return; }
  if (!GROUPS.includes(group)) {
    const c = closest(group, GROUPS);
    fail('unknown command "' + group + '".' + (c ? ' Did you mean `nixflex ' + c + '`?' : '') + ' Run `nixflex --help`.');
  }

  // --- no key needed ---
  if (group === 'login') {
    const key = process.env.NIXFLEX_API_KEY || await ask('API key (nxf_xxx:nxfs_xxx): ');
    if (!KEY_RE.test(key)) fail('That is not a full key pair (nxf_xxx:nxfs_xxx).');
    await new Nixflex({ apiKey: key, baseUrl: s('base-url') }).usage.get().catch((e: Error) => fail('Key rejected: ' + e.message));
    const cfg: Record<string, unknown> = { ...readConfig(), api_key: key };
    if (s('base-url')) cfg.base_url = s('base-url');
    writeConfig(cfg);
    out({ logged_in: true, key_id: key.split(':')[0], config: CONFIG_FILE });
    return;
  }
  if (group === 'logout') { const c = readConfig(); delete c.api_key; writeConfig(c); out({ logged_out: true }); return; }
  if (group === 'completion') { process.stdout.write(completion(cmd || '')); return; }
  if (group === 'mcp') { if (cmd !== 'setup') fail('usage: nixflex mcp setup <claude|cursor|vscode>'); mcpSetup(a1); return; }

  const client = new Nixflex({ apiKey: resolveKey(s('key')), baseUrl: s('base-url') || readConfig().base_url });
  const limit = s('limit') ? parseInt(s('limit') as string, 10) : undefined;
  const slot = (s('slot') === '2' ? 2 : 1) as 1 | 2;
  const preview = async (what: string, fetch: () => Promise<unknown>): Promise<boolean> => {
    if (confirmed) return true;
    let current: unknown = null; try { current = await fetch(); } catch { /* preview only */ }
    out({ would_delete: what, current, hint: 'add --confirm (or --yes) to proceed' });
    return false;
  };

  // --- account ---
  if (group === 'whoami') { const u = await client.usage.get(); out({ key_id: resolveKey(s('key')).split(':')[0], ...u }); return; }
  if (group === 'usage') { out(await client.usage.get()); return; }
  if (group === 'doctor') {
    const checks: Record<string, unknown> = { version: VERSION, node: process.version, key_source: s('key') ? '--key' : process.env.NIXFLEX_API_KEY ? 'env' : 'config', base_url: s('base-url') || readConfig().base_url || 'https://api.nixflex.com' };
    try { const t = Date.now(); await client.usage.get(); checks.api = 'ok (' + (Date.now() - t) + 'ms)'; } catch (e) { checks.api = 'FAILED: ' + (e as Error).message; }
    out(checks); return;
  }
  if (group === 'keys') {
    if (cmd !== 'rotate') fail('keys: rotate --confirm');
    if (!confirmed) { out({ would_rotate: resolveKey(s('key')).split(':')[0], warning: 'The current secret stops working the moment this runs. Update every place that uses it, then `nixflex login` again.', hint: 'add --confirm to proceed' }); return; }
    const r = await client.keys.rotate();
    out(r); note('Run `nixflex login` with the new secret.');
    return;
  }

  // --- agents ---
  if (group === 'agents') {
    if (cmd === 'list') { out(await client.agents.list(limit ? { limit } : {})); return; }
    if (cmd === 'get') { if (!a1) fail('agents get <agent_id>'); out(await client.agents.get(a1)); return; }
    if (cmd === 'create') {
      const body = bodyFrom(values, { name: s('name'), system_prompt: textOrFile(s('prompt')), voice_id: s('voice'), language: s('language') });
      if (!body.name || !body.system_prompt) fail('agents create --name NAME --prompt TEXT|@file [--set k=v ...]');
      out(await client.agents.create(body as never)); return;
    }
    if (cmd === 'update') {
      if (!a1) fail('agents update <agent_id> [flags] [--set k=v ...]');
      const body = bodyFrom(values, { name: s('name'), system_prompt: textOrFile(s('prompt')), voice_id: s('voice'), language: s('language'), incall_sms_enabled: boolOrNull(s('incall-sms')) });
      if (Object.keys(body).length === 0) fail('nothing to update - pass a flag or --set field=value');
      out(await client.agents.update(a1, body as never)); return;
    }
    if (cmd === 'delete') {
      if (!a1) fail('agents delete <agent_id> --confirm');
      if (!(await preview('agent ' + a1, () => client.agents.get(a1)))) return;
      out(await client.agents.delete(a1)); return;
    }
    fail('agents: list | get | create | update | delete');
  }

  // --- calls ---
  if (group === 'calls') {
    if (cmd === 'create') {
      const body = bodyFrom(values, { agent_id: s('agent'), to_number: s('to'), prompt: textOrFile(s('prompt')), from_number: s('from'), variables: vars(values.var as string[] | undefined) });
      if (!body.agent_id || !body.to_number || !body.prompt) fail('calls create --agent ID --to +44... --prompt TEXT|@file [--from] [--var k=v] [--wait]');
      const created = await client.calls.create(body as never);
      if (!values.wait) { out(created); return; }
      const id = (created as { call_id?: string }).call_id;
      if (!id) { out(created); return; }
      const deadline = Date.now() + (s('timeout') ? parseInt(s('timeout') as string, 10) : 300) * 1000;
      note('call ' + id + ' placed - waiting for it to end (Ctrl+C to stop waiting; the call continues)');
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const c = await client.calls.get(id).catch(() => null) as { ended_reason?: string; call_status?: string } | null;
        if (c && (c.ended_reason || /^(completed|failed|no[-_]answer|busy|canceled|cancelled)$/i.test(c.call_status || ''))) { out(c); return; }
        note('  ' + (c && c.call_status ? c.call_status : 'in progress') + '...');
      }
      fail('still in progress after the timeout - `nixflex calls get ' + id + '` later');
    }
    if (cmd === 'list') { const q: Record<string, unknown> = {}; if (limit) q.limit = limit; if (s('agent')) q.agent_id = s('agent'); out(await client.calls.list(q as never)); return; }
    if (cmd === 'get') { if (!a1) fail('calls get <call_id>'); out(await client.calls.get(a1)); return; }
    if (cmd === 'delete') {
      if (!a1) fail('calls delete <call_id> --confirm');
      if (!(await preview('call ' + a1 + ' and its recording', () => client.calls.get(a1)))) return;
      out(await client.calls.delete(a1)); return;
    }
    if (cmd === 'delete-all') {
      if (!confirmed) { out({ would_delete: 'EVERY call, recording and SMS record on this account', hint: 'add --confirm to proceed - this cannot be undone' }); return; }
      out(await client.calls.deleteAll()); return;
    }
    fail('calls: create | list | get | delete | delete-all');
  }

  // --- campaigns (voice batch) ---
  if (group === 'campaigns') {
    if (cmd === 'create') {
      const body = bodyFrom(values, { agent_id: s('agent'), from_number: s('from'), prompt: textOrFile(s('prompt')), name: s('name') });
      if (s('csv')) body.recipients = recipientsFromCsv(s('csv') as string, true);
      if (!body.agent_id || !body.from_number || !body.prompt || !Array.isArray(body.recipients)) fail('campaigns create --agent ID --from +44... --prompt TEXT|@file --csv people.csv [--set k=v ...]');
      note('creating campaign with ' + (body.recipients as unknown[]).length + ' recipient(s)');
      out(await client.campaigns.create(body as never)); return;
    }
    if (cmd === 'launch') { if (!a1) fail('campaigns launch <campaign_id>'); out(await client.campaigns.launch(a1)); return; }
    fail('campaigns: create | launch');
  }

  // --- numbers ---
  if (group === 'numbers') {
    if (cmd === 'list') { const r = await client.phoneNumbers.list(s('agent') ? { agent_id: s('agent') } : {}); out(JSON_MODE ? r : (r as { phone_numbers: unknown[] }).phone_numbers); return; }
    if (cmd === 'import') {
      const body = bodyFrom(values);
      if (!body.phone_number || !body.agent_id) fail('numbers import --set phone_number=+44... --set agent_id=ID --set <carrier credentials>   (or --body @number.json)');
      out(await client.phoneNumbers.import(body as never)); return;
    }
    if (cmd === 'update') {
      if (!a1) fail('numbers update <number> [flags] [--set k=v ...]');
      const body = bodyFrom(values, { sms_reply_enabled: boolOrNull(s('sms-reply')), sms_prompt: s('sms-prompt') === undefined ? undefined : (s('sms-prompt') === 'null' ? null : textOrFile(s('sms-prompt'))), dtmf_enabled: boolOrNull(s('dtmf')) });
      if (Object.keys(body).length === 0) fail('nothing to update - pass a flag or --set field=value');
      out(await client.phoneNumbers.update(a1, body as never)); return;
    }
    if (cmd === 'delete') {
      if (!a1) fail('numbers delete <number> --confirm');
      if (!confirmed) { out({ would_delete: 'number ' + a1 + ' from Nixflex (your carrier keeps it and keeps billing it)', hint: 'add --confirm to proceed' }); return; }
      out(await client.phoneNumbers.delete(a1)); return;
    }
    if (cmd === 'monitor' || cmd === 'web-calls') {
      if (!a1) fail('numbers ' + cmd + ' <number> [get|on|off]');
      const action = a2 || 'get';
      const isMon = cmd === 'monitor';
      if (action === 'get') { out(isMon ? await client.phoneNumbers.getMonitor(a1) : await client.phoneNumbers.getWebCalls(a1)); return; }
      if (action === 'on' || action === 'off') {
        if (isMon && action === 'on') note('note: monitoring bills this number\'s inbound calls at the premium rate');
        out(isMon ? await client.phoneNumbers.setMonitor(a1, action === 'on') : await client.phoneNumbers.setWebCalls(a1, action === 'on')); return;
      }
      fail('numbers ' + cmd + ' <number> [get|on|off]');
    }
    fail('numbers: list | import | update | delete | monitor | web-calls');
  }

  // --- callers (caller context) ---
  if (group === 'callers') {
    if (cmd === 'get') { if (!a1 || !a2) fail('callers get <your_number> <caller_number>'); const r = await client.callers.get(a1, a2); out(JSON_MODE ? r : r.caller.context); return; }
    if (cmd === 'set') {
      if (!a1 || !a2) fail('callers set <your_number> <caller_number> --name ... --email ... [--set k=v]');
      const nul = (v: string | undefined) => (v === undefined ? undefined : v === 'null' ? null : v);
      const body = bodyFrom(values, { name: nul(s('name')), email: nul(s('email')), phone: nul(s('phone')), location: nul(s('location')), reference_id: nul(s('reference')), preference: nul(s('preference')) });
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
        note('importing rows ' + (i + 1) + '-' + Math.min(i + 1000, rows.length) + ' of ' + rows.length);
        const r = await client.callers.import(a1, chunk as never); imported += r.imported;
      }
      out({ phone_number: a1, imported, rows: rows.length }); return;
    }
    if (cmd === 'delete') {
      if (!a1 || !a2) fail('callers delete <your_number> <caller_number> --confirm');
      if (!(await preview('caller ' + a2 + ' on ' + a1, async () => (await client.callers.get(a1, a2)).caller.context))) return;
      out(await client.callers.delete(a1, a2)); return;
    }
    fail('callers: get | set | import | delete');
  }

  // --- sms ---
  if (group === 'sms') {
    if (cmd === 'send') {
      const body = bodyFrom(values, { agent_id: s('agent'), from_number: s('from'), to: s('to'), message: textOrFile(s('message')) });
      if (!body.agent_id || !body.from_number || !body.to || !body.message) fail('sms send --agent ID --from +44... --to +44... --message TEXT');
      out(await client.sms.send(body as never)); return;
    }
    if (cmd === 'campaigns') {
      const sub = a1; const id = a2;
      if (sub === 'create') {
        const body = bodyFrom(values, { agent_id: s('agent'), from_number: s('from'), message: textOrFile(s('message')), name: s('name') });
        if (s('csv')) body.recipients = recipientsFromCsv(s('csv') as string, false);
        if (!body.agent_id || !body.from_number || !body.message || !Array.isArray(body.recipients)) fail('sms campaigns create --agent ID --from +44... --message TEXT|@file --csv people.csv');
        out(await client.sms.campaigns.create(body as never)); return;
      }
      if (sub === 'launch') { if (!id) fail('sms campaigns launch <id>'); out(await client.sms.campaigns.launch(id)); return; }
      if (sub === 'list') { const q: Record<string, unknown> = {}; if (limit) q.limit = limit; if (s('status')) q.status = s('status'); const r = await client.sms.campaigns.list(q as never); out(JSON_MODE ? r : ((r as { campaigns?: unknown[] }).campaigns || r)); return; }
      if (sub === 'get') { if (!id) fail('sms campaigns get <id>'); out(await client.sms.campaigns.get(id)); return; }
      if (sub === 'delete') {
        if (!id) fail('sms campaigns delete <id> --confirm');
        if (!(await preview('sms campaign ' + id + ' (pending recipients will not be messaged)', () => client.sms.campaigns.get(id)))) return;
        out(await client.sms.campaigns.delete(id)); return;
      }
      fail('sms campaigns: create | launch | list | get | delete');
    }
    fail('sms: send | campaigns');
  }

  // --- webhooks (per number) ---
  if (group === 'webhooks') {
    if (cmd === 'set') { if (!a1 || !a2) fail('webhooks set <number> <url> [--slot 1|2]'); out(await client.webhooks.set(a1, a2, slot)); return; }
    if (cmd === 'get') { if (!a1) fail('webhooks get <number> [--slot 1|2]'); out(await client.webhooks.get(a1, slot)); return; }
    if (cmd === 'delete') {
      if (!a1) fail('webhooks delete <number> [--slot 1|2] --confirm');
      if (!(await preview('webhook slot ' + slot + ' on ' + a1, () => client.webhooks.get(a1, slot)))) return;
      out(await client.webhooks.delete(a1, slot)); return;
    }
    fail('webhooks: set | get | delete');
  }

  // --- bring your own: storage / llm / tts (same shape) ---
  if (group === 'storage' || group === 'llm' || group === 'tts') {
    const res = client[group] as unknown as { set: (b: never) => Promise<unknown>; get: () => Promise<unknown>; delete: () => Promise<unknown> };
    if (cmd === 'set') {
      const body = bodyFrom(values);
      if (Object.keys(body).length === 0) fail(group + ' set --set field=value ... (or --body @file.json) - see https://docs.nixflex.com/advanced/your-own-' + group);
      out(await res.set(body as never)); return;
    }
    if (cmd === 'get') { out(await res.get()); return; }
    if (cmd === 'delete') {
      if (!(await preview('your own ' + group + ' configuration (calls fall back to Nixflex)', () => res.get()))) return;
      out(await res.delete()); return;
    }
    fail(group + ': set | get | delete');
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
