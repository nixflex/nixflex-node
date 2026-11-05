# K7 — 2026-11-05 (same unpublished candidate versions)

- Added call booking-result and outbound request-status reads to Node, CLI, Python sync/async and MCP (96 tools).
- Optional UUID request_id on outbound create; local prepare helpers save the identity before sending. CLI --output writes exclusive UTF-8 JSON; no implicit redial or replacement ID.
- First acceptance 201 and same-call replay 200 are distinct; unconfirmed journal acknowledgement preserves a known call ID. Four typed B56 errors retain safe UUID/status/code details.
- Booking ready/none/processing/deleted/unavailable stay distinct; private markers are removed. Exact timeline/final shapes and examples are in CALL-REQUESTS.md / KIT-EXAMPLES-K7.md.
- MCP create_call keeps the old no-ID path. New safe_retry prepares only; request_id requires confirm:true. The other 93 contracts and all unrelated handlers remain unchanged. Earlier exclusions remain.
- Local candidate only. Locked full-list/schema checks await K7 owner approval; no publication is authorized by this changelog.

# 0.11.0 — 2026-11-04 (unpublished candidate)

- Added four per-number Google Calendar methods and in-place carrier credential updates; matching CLI commands / five MCP tools (94 total).
- Credential CLI input is private environment/stdin only; MCP reads private environment after explicit confirmation. No secret arguments/output or automatic write retries.
- Added typed calendar/credential errors and nullable booking webhook models; service accepts string, number or null.
- Compatibility notice: SMS suppression is now HTTP 409 do_not_contact/conflict. Node/Python: catch NixflexDoNotContactError, while retaining old-server 400 invalid_request handling. MCP/CLI: inspect structured status/code. Never retry or remove opt-out automatically; not every 400 is suppression.
- All 89 previous MCP tools, schemas, handlers and safeguards preserved. Engine endpoints and previous kit exclusions unchanged except the expressly added K6 operations.

## Unreleased K5b — 2 November 2026

- Document and verify caller_not_found versus phone_number_not_found; error mapping and retry behavior are unchanged.
- Node keyterms return typing includes all six B49g response fields; no runtime request change.
- Safe staging checker uses an owned non-protected number and exact caller absence code.

## K5 approved follow-up — 2 November 2026

- Versions approved; SDK/CLI Knowledge coverage unchanged. Legacy draft GET can normalize and save: manual use only, excluded from the safe checker and MCP.
- Published-mode MCP setup pins 0.4.0; publish and verify MCP before Node. Unpublished-mode refusal remains tested.
- No push or publication performed.

## Unreleased K5 — 2 November 2026

- All 39 public Knowledge operations plus automatic keyterms read.
- Explicit revisions/operation keys, bounded polling, streamed uploads and JSON exports; partial exports never replay.
- New CLI POST/change commands require confirmation. Safe CLI errors preserve uncertainty.
- Complete K1–K5 public method guides; no private signing-secret or account-erasure additions.
- Node public declarations no longer export unused private provider-specific types; engine endpoints unchanged.
- Approved versions, not published; successful writes await manual staging.

## Unreleased K4 â€” 2 November 2026

- MCP now has 70 tools: 59 prior descriptors/permissions unchanged plus 11
  approved additions. Only get_webhook and the unconfirmed delete_webhook preview
  mask URL output; their errors, retries, confirmation and confirmed deletion stay
  unchanged. New credential-setting/disconnect tools and signing secrets stay out.
- Organisation activity accepts UTC dates; event IDs/cursors are strings and
  types now describe actor/sentence/displayed result. Added streamed CSV export
  and organisation rename. CSV never retries after emitting data.
- Added all public integration settings to Node/CLI and Python sync/async.
  PUT replaces config; function PATCH changes supplied fields only.
- CLI private integration output omits URLs, credentials, headers and free-form
  schemas, including existing webhook reads/previews. SDK responses retain exact
  wire data; callers must not log private configuration.
- New CLI writes require confirmation before any request. Existing mutation
  retry/outcome safety stays unchanged. No signing-secret method; personal
  session-only flows stay dashboard only.
- Candidate versions unchanged; nothing published. Successful real writes
  require separate manual testing; offline tests are not staging evidence.

## Unreleased K3 â€” 2 November 2026

- Added voice/SMS campaign controls, contact-hour preview and suppression lists,
  web widget settings, and agent inbox reads/settings with exact public paths.
- Node/CLI and Python sync/async now cover all 27 C5 operations. Revisions and
  read versions stay strings; nullable fields, JSON variables and cursors survive.
- Python inbox boolean queries use lowercase true/false. Reads never mark read.
- MCP now has 59 tools: 44 existing definitions/handlers unchanged plus 15 reviewed
  additions. Every new mutation requires confirmation before any request.
- Intentional MCP exclusions: voice/SMS resume, voice/SMS consent and suppression
  removal can enable outreach. All remain in API/SDK/CLI. Signup remains excluded
  because it returns a new secret; bulk deletion remains excluded for AI safety.
- Creation can start work immediately; there is no safe draft-only campaign mode.
  Writes never automatically repeat. Successful real writes need separate testing.
- Candidate versions unchanged; nothing published. Existing SDK/CLI methods and
  engine endpoints remain available. SMS reuse_campaign_id is not supported.

# 0.10.0 â€” K1, 1 November 2026 (unpublished)

Removed calls.billing, phoneNumbers.setMonitor/getMonitor, storage/llm/tts.set/get/delete; CLI calls billing, numbers monitor and storage/llm/tts commands.
Reason: **non-public by Fahim decision**. Engine endpoints stay unchanged.

K1 corrects SMS campaign `message_template` and `scheduled_date`, root recipient
country/timezone, explicit policy values, single-contact location/context, SMS
cursors and envelopes, agent empty-create/defaults, and recording `expires_at`.
New agents use engine defaults: 300-second maximum, 10-second silence hang-up,
dynamic greeting ON. Omission uses engine defaults; explicit values are preserved.
With agent knowledge enabled, prompt admission is 3,000 tokens; the legacy OFF
path has its 16,000-character limit. This release adds no prompt-measurement methods.
Use the organisation webhook signing secret, independent of API-key rotation.

All kits expose errors as `{error:{type,code,message,details,doc_url,status,request_id}}`.
Node uses `toJSON()`, Python `to_dict()`, CLI/MCP use JSON. Missing metadata is null.
Timeout defaults to 30 seconds. GET retries once (Node/Python configurable, capped
at three); mutations never retry automatically, even DELETE or 429. A lost or
malformed mutation reply is outcome unknown: check before retrying. Explicit
not-sent proof stays visible. Do not wrap mutations in blind retry loops.
Launch acknowledges scheduling; recipient-local gates still apply. SMS deletion
refuses active work, returns the engine message and never promises cancellation.
Recording availability may be pending/unavailable; use expires_at, not a fixed
five-minute lifetime (private mode 600 seconds, compatibility mode 300).
Legacy SDK calls.list(agent_id=...) now refuses the ineffective filter; use history.
The CLI routes calls list --agent to history. MCP filtered lists already use history.
Dedicated billing, monitoring, BYO and personal-auth actions are non-public.
Number PATCH monitor_enabled remains an existing public setting; it is not a listener operation.
Engine endpoints are unchanged. This release is local and not published.

TypeScript: from_number is now required for SMS. Use message_template and scheduled_date in new code; old JavaScript message/scheduled_at aliases translate only when unambiguous. SMS detail is {campaign,recipients,messages,pagination}, not a flat campaign. Raw byte/idempotency/revision transport is preparation only; no knowledge endpoint wrappers were added.

## Historical releases

## 0.8.0
- CLI now covers every SDK method: calls delete/delete-all, campaigns create (CSV) + launch, numbers import/delete/monitor/web-calls, sms campaigns, webhooks, keys rotate, storage/llm/tts. A guard test fails the build if an SDK method has no command.
- `--set field=value` (repeatable) and `--body @file.json` on every create/update/set - new API fields need no CLI update.
- `--yes` alias for `--confirm`; every destructive command previews first. `--base-url` for staging. `calls create --wait` polls until the call ends and prints the result. `completion <bash|zsh|pwsh>`. Did-you-mean on mistyped commands.
- Fixes: `login` uses a visible prompt (the hidden one dropped pasted input on Windows); `mcp setup` no longer writes a `\` env block desktop apps cannot expand - the MCP server reads ~/.nixflex/config.json.

## 0.7.0
- New: the `nixflex` CLI ships in this package - `npx nixflex --help`. Agents, calls, numbers, caller context (incl. CSV import), SMS, usage, doctor, `login` (key stored in ~/.nixflex/config.json) and `mcp setup`. Every command takes `--json`; deletes need `--confirm`. Zero dependencies - it calls this SDK. Docs: https://docs.nixflex.com/cli

## 0.6.0
- New: `client.callers` - caller context on one of your numbers: `get()`, `set()` (omitted fields kept, null removes), `delete()` (erases yours and the engine's), `import()` (up to 1,000 rows, validated before any write). One record per (your number, caller number). Docs: https://docs.nixflex.com/concepts/caller-context
- New: `incall_sms_enabled` on agent create/update/get - texting during a call and automatic booking-confirmation texts. Default false for new agents. Docs: https://docs.nixflex.com/actions/in-call-sms
- Fix: User-Agent now reports the real SDK version (was stuck at 0.1.0).
## 0.5.0

- Historical private model and voice integrations were removed from the public kits by the K1 scope decision. Manage them in the dashboard.
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

## K2 core API additions â€” 1 November 2026

K2 core additions (same unpublished 0.10.0 candidate): account.retention(), keys.activity(), voices.list()/get(); CLI account retention / keys activity / voices list|get / keys create. keys create requires --confirm and sends no existing credential. Calls list now forwards --offset; callers import --body preserves JSON null clears and numeric references. All writes remain single-attempt. No billing, monitoring or account-closure wrappers were added.
