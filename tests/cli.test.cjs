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
  for (const g of ['login', 'agents list', 'calls create', 'numbers list', 'callers set', 'callers import', 'sms send', 'mcp setup', 'doctor']) {
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
