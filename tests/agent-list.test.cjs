const { test } = require('node:test');
const a = require('node:assert/strict');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { Nixflex } = require('../dist/index.cjs');
async function fixture(fn, run) {
  const server = http.createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(fn(new URL(req.url, 'http://fixture')))); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port;
  try { await run(new Nixflex({ apiKey: 'fixture:fixture', baseUrl: url, maxRetries: 0 }), url); }
  finally { await new Promise(r => server.close(r)); }
}
test('agent iterator returns >200 items, exact full page and empty page without stopping early', async () => {
  for (const count of [451, 400, 0]) {
    const seen = [], rows = Array.from({ length: count }, (_, i) => ({ agent_id: String(i) }));
    await fixture(url => { seen.push(url); const start = Number(url.searchParams.get('offset')), size = Number(url.searchParams.get('limit')); return rows.slice(start, start + size); }, async client => {
      const result = []; for await (const row of client.agents.iter(200)) result.push(row);
      a.deepEqual(result, rows);
      a.deepEqual(seen.map(url => url.searchParams.get('offset')), count ? ['0','200','400'] : ['0']);
      a.ok(seen.every(url => url.searchParams.get('limit') === '200'));
    });
  }
});
test('agent iterator rejects invalid sizes before any request, including old oversized request', async () => {
  let hits = 0;
  await fixture(() => { hits++; return []; }, async client => {
    for (const size of [0, -1, 201, 500, 1.5, NaN, Infinity, '100', null]) await a.rejects(async () => { for await (const row of client.agents.iter(size)) void row; }, RangeError);
    a.equal(hits, 0);
    for await (const row of client.agents.iter(1)) void row;
    a.equal(hits, 1);
  });
});
test('agent list forwards filters and request cancellation; real CLI supports offset/search/status', async () => {
  const seen = [];
  await fixture(url => { seen.push(url); return [{ agent_id: 'a', is_active: false }]; }, async (client, url) => {
    const search = 'Support & "EU",*';
    a.equal((await client.agents.list({ limit: 200, offset: 200, status: 'all', search }))[0].is_active, false);
    const abort = new AbortController(); abort.abort();
    await a.rejects(() => client.agents.list({}, { signal: abort.signal }));
    const env = {}; for (const k of ['PATH','Path','SystemRoot','TEMP','TMP']) if (process.env[k]) env[k] = process.env[k];
    async function cli(flags) { return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['dist/cli/index.js','agents','list','--json','--base-url',url,...flags], { env: { ...env, NIXFLEX_API_KEY: 'nxf_fixture:nxfs_fixture' } });
      let out = '', err = ''; child.stdout.on('data', b => out += b); child.stderr.on('data', b => err += b); child.on('error', reject); child.on('close', code => resolve({ code, out, err }));
    }); }
    const result = await cli(['--limit','200','--offset','200','--status','all','--search',search]);
    a.equal(result.code, 0, result.err); a.equal(JSON.parse(result.out)[0].agent_id, 'a');
    a.equal(seen.length, 2);
    for (const req of seen) a.deepEqual(Object.fromEntries(req.searchParams), { limit:'200', offset:'200', status:'all', search });
    for (const flags of [['--limit','2abc'],['--limit','201'],['--offset','-1'],['--status','wrong']]) a.notEqual((await cli(flags)).code, 0);
    a.equal(seen.length, 2);
  });
});
test('batch2 create update and read types remain separate and list accepts new filters', () => {
  const r = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','tests/agent-batch2-types.ts'], { encoding:'utf8' });
  a.equal(r.status, 0, r.stdout + r.stderr);
});
