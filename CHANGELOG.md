## 0.3.0 (2026-08-23)

- Call type: `charged_minutes` (minutes actually billed - transfers stop the meter at handoff, so this can be less than the recording length)
- Call type: `ended_reason` documented with the full value list, including the new `callee_hangup` (outbound) and carrier words (`busy`, `failed`, `no-answer`, `canceled`)
- No breaking changes. `list` pagination (`limit`/`offset`) shipped previously in 0.2.x.
# Changelog

All notable changes to the `nixflex` package. This project follows
[semantic versioning](https://semver.org): patch for fixes, minor for new
features, major for breaking changes. Published methods are never removed or
renamed within a major version.

## 0.2.2

- Corrected the SMS campaign documentation: rom_number may be on either carrier
  (Twilio or Telnyx). An earlier docs page wrongly stated Telnyx was rejected at
  create; the engine routes by provider. No code behaviour changed.

## 0.2.1

- Added MIT `LICENSE`, this changelog, and repository/homepage/issue metadata
  so the npm page links back to the source and docs.
- Documented `verifyWebhookSignature` in the README.
- Continuous integration now builds and runs the test suite on every push.
- No API changes.

## 0.2.0

- **Added** `verifyWebhookSignature(rawBody, signatureHeader, keySecret)` and
  `client.webhooks.verify(...)` - verifies the `X-Nixflex-Signature` header
  (HMAC-SHA256 over `"<timestamp>.<body>"`) with a constant-time comparison and
  a configurable replay window (5 minutes by default). Never throws.
- **Added** `client.calls.delete(callId)` - permanently erases one call record,
  transcript, and recording file.
- **Added** `client.calls.deleteAll()` - erases all calls, recordings, and SMS
  messages on the key.
- Added `@types/node` as a development dependency (required for `Buffer` and
  `node:crypto` types in the generated declarations).

## 0.1.0

First public release.

- `agents` - create, list, get, update, delete, `iter()`
- `calls` - create outbound, list, get, `iter()`
- `campaigns` - create and launch voice batch campaigns
- `phoneNumbers` - import, list, update, delete, monitor and web-call toggles
- `sms` - single sends and bulk campaigns
- `keys` - rotate the API secret
- `usage` - account usage and limits
- `webhooks` - per-number webhook configuration
- Typed errors per HTTP status, automatic retry on `429` honouring
  `Retry-After`, retries on network failure, and no blind retry of `POST`
  requests after a `5xx` (a call is never dialled twice).
- Dual ESM and CommonJS builds, TypeScript declarations, zero runtime
  dependencies, Node 18 or newer.
