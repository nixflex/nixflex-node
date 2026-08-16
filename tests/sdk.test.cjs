// ============================================
// tests/sdk.test.js
// BEHAVIOURAL tests against a real local HTTP server - not mocks of mocks.
// Locks the four behaviours that make this SDK industry-grade:
//   1. 429 auto-retry honouring Retry-After (the API really sends it)
//   2. Typed errors carrying the API's errorHelper fields
//   3. POST never blind-retries a 5xx (a retried call POST could dial twice)
//   4. iter() pages until a short page
// Run: node --test tests/
// ============================================
const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { Nixflex, NixflexRateLimitError, NixflexAuthenticationError, NixflexServerError } = require('../dist/index.cjs');

function startServer(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

test('429 is retried once, honouring Retry-After', async () => {
  let hits = 0;
  const { srv, url } = await startServer((req, res) => {
    hits++;
    if (hits === 1) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '1' });
      res.end(JSON.stringify({ error: { type: 'rate_limit', code: 'rate_limit_exceeded', message: 'slow down' } }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ agent_id: 'agent_1' }]));
    }
  });
  const client = new Nixflex({ apiKey: 'nxf_t:nxfs_t', baseUrl: url });
  const agents = await client.agents.list();
  srv.close();
  assert.strictEqual(hits, 2, '429 must be retried exactly once');
  assert.strictEqual(agents[0].agent_id, 'agent_1');
});

test('errors carry code/type/status and the right class', async () => {
  const { srv, url } = await startServer((req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { type: 'authentication_error', code: 'invalid_key', message: 'Invalid or missing API key', doc_url: 'https://docs.nixflex.com/errors/invalid_key' } }));
  });
  const client = new Nixflex({ apiKey: 'nxf_t:nxfs_t', baseUrl: url, maxRetries: 0 });
  await assert.rejects(
    () => client.calls.get('CA_x'),
    (e) => e instanceof NixflexAuthenticationError && e.code === 'invalid_key' && e.status === 401 && e.docUrl.includes('docs.nixflex.com')
  );
  srv.close();
});

test('POST does NOT blind-retry a 5xx (no double calls) - GET does', async () => {
  let postHits = 0, getHits = 0;
  const { srv, url } = await startServer((req, res) => {
    if (req.method === 'POST') postHits++; else getHits++;
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { type: 'server_error', code: 'internal_error', message: 'boom' } }));
  });
  const client = new Nixflex({ apiKey: 'nxf_t:nxfs_t', baseUrl: url, maxRetries: 1 });
  await assert.rejects(() => client.calls.create({ agent_id: 'a', to_number: '+4', prompt: 'p' }), (e) => e instanceof NixflexServerError);
  await assert.rejects(() => client.calls.list(), (e) => e instanceof NixflexServerError);
  srv.close();
  assert.strictEqual(postHits, 1, 'POST hit the server ONCE - a retried outbound-call POST could dial someone twice');
  assert.strictEqual(getHits, 2, 'GET retried once (idempotent - safe)');
});

test('iter() pages until a short page', async () => {
  const calls = [];
  const { srv, url } = await startServer((req, res) => {
    calls.push(req.url);
    const u = new URL(req.url, 'http://x');
    const offset = parseInt(u.searchParams.get('offset') || '0', 10);
    const page = offset === 0
      ? Array.from({ length: 2 }, (_, i) => ({ call_id: 'CA_' + i }))
      : [{ call_id: 'CA_last' }];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(page));
  });
  const client = new Nixflex({ apiKey: 'nxf_t:nxfs_t', baseUrl: url });
  const seen = [];
  for await (const c of client.calls.iter(2)) seen.push(c.call_id);
  srv.close();
  assert.deepStrictEqual(seen, ['CA_0', 'CA_1', 'CA_last']);
  assert.strictEqual(calls.length, 2, 'stopped after the short page');
});

test('rate limit error exposes retryAfterSeconds', async () => {
  const { srv, url } = await startServer((req, res) => {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '42' });
    res.end(JSON.stringify({ error: { type: 'rate_limit', code: 'rate_limit_exceeded', message: 'slow down' } }));
  });
  const client = new Nixflex({ apiKey: 'nxf_t:nxfs_t', baseUrl: url, maxRetries: 0 });
  await assert.rejects(
    () => client.agents.list(),
    (e) => e instanceof NixflexRateLimitError && e.retryAfterSeconds === 42
  );
  srv.close();
});
