## 0.6.0
- New: `client.callers` - caller context on one of your numbers: `get()`, `set()` (omitted fields kept, null removes), `delete()` (erases yours and the engine's), `import()` (up to 1,000 rows, validated before any write). One record per (your number, caller number). Docs: https://docs.nixflex.com/concepts/caller-context
- New: `incall_sms_enabled` on agent create/update/get - texting during a call and automatic booking-confirmation texts. Default false for new agents. Docs: https://docs.nixflex.com/actions/in-call-sms
- Fix: User-Agent now reports the real SDK version (was stuck at 0.1.0).
## 0.5.0

- New: `client.llm` - bring your own OpenAI-compatible model (set() verifies with a real completion + tool-calling probe, key write-only). Calls it serves bill at -0.015/min.
- New: `client.tts` - bring your own voice (elevenlabs/cartesia, set() verifies with a real synthesis, key write-only). Phone calls only; -0.02/min.
- Docs: https://docs.nixflex.com/advanced/your-own-llm and /advanced/your-own-tts

## 0.4.0

- New: `client.storage` - connect your own S3-compatible bucket for call recordings (data residency). `storage.set()` verifies with a probe write before saving, `storage.get()` never returns the secret, `storage.delete()` disconnects. Recordings then upload to your bucket and `recording_url` becomes a `byo:` path. See https://docs.nixflex.com/advanced/your-own-storage

## 0.3.1 (2026-08-24)

- Voicemail as a structured setting: `voicemail_leave_enabled` + `voicemail_message` on Agent (applies to dashboard-imported numbers) and on PhoneNumber / PhoneNumberUpdateParams (the only voicemail control for API-imported numbers - no inheritance across the two worlds)
- Enabling without a message is rejected with `voicemail_message_required`
- No breaking changes.
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
