// ============================================
// tests/stage3.test.cjs
// Stage 3 behavioural tests. Locks the traps the docs warn about:
//   1. + in phone-number paths is URL-encoded (raw + becomes a space = 404s)
//   2. sms.send uses `to` (the calls endpoint uses to_number - different!)
//   3. monitor/web-calls toggles hit the /integrations/... paths
//   4. webhook slot 2 routes to webhook2
// ============================================
const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { Nixflex } = require('../dist/index.cjs');

function startServer(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

test('phone number + is URL-encoded in every path', async () => {
  const paths = [];
  const { srv, url } = await startServer((req, res) => {
    paths.push(req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, phone_number: '+447446466847' }));
  });
  const c = new Nixflex({ apiKey: 'a:b', baseUrl: url });
  await c.phoneNumbers.update('+447446466847', { sms_reply_enabled: true });
  await c.phoneNumbers.delete('+447446466847');
  await c.phoneNumbers.setMonitor('+447446466847', true);
  await c.webhooks.set('+447446466847', 'https://x.com/hook');
  srv.close();
  for (const p of paths) {
    assert.ok(p.includes('%2B447446466847'), `path must encode +, got: ${p}`);
    assert.ok(!p.includes('/+44'), `raw + leaked into path: ${p}`);
  }
});

test('sms.send posts `to` (not to_number) to /v1/sms', async () => {
  let captured = null; let path = null;
  const { srv, url } = await startServer((req, res) => {
    path = req.url;
    let body = '';
    req.on('data', (d) => body += d);
    req.on('end', () => {
      captured = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'sent', to: captured.to, from: '+44x' }));
    });
  });
  const c = new Nixflex({ apiKey: 'a:b', baseUrl: url });
  await c.sms.send({ agent_id: 'agent_1', to: '+447386172392', message: 'hi' });
  srv.close();
  assert.strictEqual(path, '/v1/sms');
  assert.strictEqual(captured.to, '+447386172392');
  assert.strictEqual(captured.to_number, undefined, 'to_number must NOT be sent - that is the calls field');
});

test('monitor + web-calls toggles hit /integrations paths; webhook slot 2 routes to webhook2', async () => {
  const seen = [];
  const { srv, url } = await startServer((req, res) => {
    seen.push(`${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
  const c = new Nixflex({ apiKey: 'a:b', baseUrl: url });
  await c.phoneNumbers.setMonitor('+441', true);
  await c.phoneNumbers.setWebCalls('+441', false);
  await c.webhooks.set('+441', 'https://x.com/h', 2);
  await c.webhooks.delete('+441', 1);
  srv.close();
  assert.ok(seen[0].startsWith('PUT /v1/integrations/monitor/number/'), seen[0]);
  assert.ok(seen[1].startsWith('PUT /v1/integrations/web-calls/number/'), seen[1]);
  assert.ok(seen[2].startsWith('PUT /v1/integrations/webhook2/number/'), 'slot 2 must route to webhook2: ' + seen[2]);
  assert.ok(seen[3].startsWith('DELETE /v1/integrations/webhook/number/'), seen[3]);
});

test('campaigns + usage route correctly with query params', async () => {
  const seen = [];
  const { srv, url } = await startServer((req, res) => {
    seen.push(`${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ campaigns: [] }));
  });
  const c = new Nixflex({ apiKey: 'a:b', baseUrl: url });
  await c.sms.campaigns.list({ status: 'done', limit: 5 });
  await c.usage.get();
  srv.close();
  assert.ok(seen[0].includes('/v1/sms/campaigns?') && seen[0].includes('status=done') && seen[0].includes('limit=5'), seen[0]);
  // REALITY (verified live Aug 2026): /v1/usage takes NO query params - the docs' period/since/until never existed.
  assert.ok(seen[1] === 'GET /v1/usage', seen[1]);
});
