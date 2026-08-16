// ============================================
// tests/verify.test.cjs
// Webhook signature verification - golden vector + attack cases.
// The golden vector was computed ONCE from the documented scheme; if this
// test ever fails, either the verifier or the engine's signing changed -
// both are breaking changes for every webhook consumer.
// ============================================
const { test } = require('node:test');
const assert = require('node:assert');
const { verifyWebhookSignature } = require('../dist/index.cjs');

const SECRET = 'nxfs_testsecret_0123456789abcdef';
const BODY = '{"event":"call.completed","call_id":"CA123"}';
const T = 1755300000;
const GOLDEN = 't=' + T + ',v1=8244940dd2d19c8d603cfd55b40de1cd94b98de4aca1f56b98cdd5f44ea98031';

test('golden vector verifies', () => {
  assert.strictEqual(verifyWebhookSignature(BODY, GOLDEN, SECRET, { now: T }), true);
});

test('tampered body is rejected', () => {
  const tampered = BODY.replace('CA123', 'CA999');
  assert.strictEqual(verifyWebhookSignature(tampered, GOLDEN, SECRET, { now: T }), false);
});

test('wrong secret is rejected', () => {
  assert.strictEqual(verifyWebhookSignature(BODY, GOLDEN, 'nxfs_wrong', { now: T }), false);
});

test('stale signature is rejected (replay protection)', () => {
  assert.strictEqual(verifyWebhookSignature(BODY, GOLDEN, SECRET, { now: T + 10000 }), false);
  assert.strictEqual(verifyWebhookSignature(BODY, GOLDEN, SECRET, { now: T + 200 }), true, 'within tolerance must pass');
});

test('garbage headers are rejected, never throw', () => {
  assert.strictEqual(verifyWebhookSignature(BODY, null, SECRET), false);
  assert.strictEqual(verifyWebhookSignature(BODY, 'nonsense', SECRET), false);
  assert.strictEqual(verifyWebhookSignature(BODY, 't=abc,v1=zzz', SECRET), false);
  assert.strictEqual(verifyWebhookSignature(BODY, GOLDEN, ''), false);
});
