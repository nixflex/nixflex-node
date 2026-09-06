// tests/cli.test.cjs - smoke tests for the built CLI (dist/cli/index.js).
// Offline: nothing here hits the API. They prove the binary starts, the help lists every
// command group, errors exit with the documented codes, and JSON mode stays parseable.
// Run `npm run build` first - `npm run check` does not build.
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const CLI = path.join(__dirname, '..', 'dist', 'cli', 'index.js');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
function run(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, NIXFLEX_API_KEY: '', HOME: __dirname, USERPROFILE: __dirname, ...env } });
}

test('cli: built binary exists and reports the package version', () => {
  assert.ok(fs.existsSync(CLI), 'dist/cli/index.js missing - run npm run build');
  const r = run(['--version']);
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), pkg.version, 'CLI version must equal package.json version (baked in by tsup.config.ts)');
});

test('cli: help lists every command group', () => {
  const r = run(['--help']);
  assert.strictEqual(r.status, 0);
  for (const g of ['login', 'agents list', 'calls create', 'campaigns create', 'numbers list', 'callers set', 'callers import', 'sms send', 'sms campaigns', 'webhooks set', 'keys rotate', 'storage set', 'llm', 'tts', 'mcp setup', 'doctor', 'completion']) {
    assert.ok(r.stdout.includes(g), 'help is missing: ' + g);
  }
});

test('cli: unknown command exits 1 with a hint', () => {
  const r = run(['bogus']);
  assert.strictEqual(r.status, 1);
  assert.ok(/unknown command/.test(r.stderr));
});

test('cli: a command that needs a key exits 2 when none is configured', () => {
  const r = run(['agents', 'list']);
  assert.strictEqual(r.status, 2, 'missing key must be exit code 2 (documented)');
  assert.ok(/nixflex login/.test(r.stderr));
});

test('cli: --json errors are valid JSON and never crash the process', () => {
  // A malformed key fails validation before any network call.
  const r = run(['agents', 'list', '--json'], { NIXFLEX_API_KEY: 'not-a-key' });
  assert.strictEqual(r.status, 2);
  assert.ok(!/Assertion failed/.test(r.stderr + r.stdout), 'process.exit() before stdout flushed crashes Node on Windows - use exitCode');
});

test('cli: package bin points at the built file', () => {
  assert.strictEqual(pkg.bin && pkg.bin.nixflex, './dist/cli/index.js');
  assert.ok(fs.readFileSync(CLI, 'utf8').startsWith('#!/usr/bin/env node'), 'shebang missing - npx nixflex would not run');
});

// COVERAGE GUARD: every public SDK method must have a CLI command in --help. The CLI is
// the SDK's mirror; if the SDK grows a method and this fails, add the subcommand + help
// line + doc row in the same session (the CLI rule).
test('cli: every SDK method is reachable from the CLI', () => {
  const resDir = path.join(__dirname, '..', 'src', 'resources');
  const src = fs.readdirSync(resDir).filter((f) => f.endsWith('.ts')).map((f) => fs.readFileSync(path.join(resDir, f), 'utf8')).join('\n');
  const groupOf = { Agents: 'agents', Calls: 'calls', Campaigns: 'campaigns', PhoneNumbers: 'numbers', Callers: 'callers', Sms: 'sms', SmsCampaigns: 'sms campaigns', Keys: 'keys', UsageResource: 'usage', Webhooks: 'webhooks', Storage: 'storage', Llm: 'llm', Tts: 'tts' };
  const rename = { deleteAll: 'delete-all', setMonitor: 'monitor', getMonitor: 'monitor', setWebCalls: 'web-calls', getWebCalls: 'web-calls' };
  const skip = new Set(['Webhooks.verify']); // local crypto helper, not an API call
  const help = run(['--help']).stdout;
  const classes = src.split(/export class /).slice(1);
  const missing = [];
  for (const block of classes) {
    const name = block.split(/\s/)[0];
    const group = groupOf[name];
    assert.ok(group, 'new SDK resource "' + name + '" has no CLI group mapping in this test - add it');
    for (const m of block.matchAll(/^  ([a-zA-Z]+)\(/gm)) {
      const method = m[1];
      if (method === 'constructor' || skip.has(name + '.' + method)) continue;
      const cmd = rename[method] || method;
      const expect = group === 'usage' ? 'usage' : group + ' ' + cmd;
      const re = new RegExp('(^|\\s|\\|\\s)' + expect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$|\\s\\|)', 'm');
      if (!re.test(help)) missing.push(name + '.' + method + ' -> "' + expect + '"');
    }
  }
  assert.deepStrictEqual(missing, [], 'SDK methods with no CLI command in --help:\n  ' + missing.join('\n  '));
});
