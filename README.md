# Nixflex Node.js SDK

## MCP setup foundation (local 0.9.1 candidate, not published)

The SDK's API behaviour is unchanged. MCP setup now requires Node 22+ and uses
secret-free, version-pinned OS-specific launchers. Supported tools are Claude
Desktop, Claude Code, Codex and Cursor; VS Code setup is retired. Run 1 writes only
Claude Desktop/Cursor configs; the other installers are run 3. The shared builders
already cover all four formats. See `FOUNDATION.md` for the local packed test.

`nixflex mcp setup <claude|cursor> --mcp-local <unpacked-package-directory>` can test
the unpublished MCP locally. Normal npm-mode setup is intentionally blocked while
the candidate is unpublished. No key is copied to the client configuration.
Provide a key and its explicit approved API URL through the client's environment,
or use an existing legacy credential file with its saved URL. Legacy login is
plaintext storage, not an OS vault. Secure credential setup is deferred to run 3.
Malformed/unreadable config is refused; unrelated entries/comments are preserved.
Replacement shows a redacted preview and needs confirmation (`--confirm` for scripts).
Close other config editors while setup runs; do not run concurrent installers.

Official Node.js SDK for the [Nixflex](https://nixflex.com) voice AI platform — AI phone agents, outbound campaigns, SMS, and web calls.

```bash
npm install nixflex
```

## Quickstart

```js
import Nixflex from 'nixflex';

const client = new Nixflex({ apiKey: 'nxf_xxx:nxfs_xxx' });

// Create an agent (every field has a sensible default)
const agent = await client.agents.create({
  name: 'Acme Dental Receptionist',
  system_prompt: 'You are the friendly front-desk assistant at Acme Dental...',
});

// Attach a number you own (carrier inferred from credentials)
await client.phoneNumbers.import({
  phone_number: '+447446466847',
  twilio_sid: process.env.TWILIO_SID,
  twilio_token: process.env.TWILIO_TOKEN,
  agent_id: agent.agent_id,
});

// Trigger an outbound AI call (fire-and-forget)
const call = await client.calls.create({
  agent_id: agent.agent_id,
  to_number: '+447386172392',
  prompt: 'Remind {patient_name} about their appointment on {time}.',
  dynamic_vars: { patient_name: 'Sarah', time: 'Tuesday at 2pm' },
});
```

## Resources

| Resource | Methods |
|---|---|
| `client.agents` | `create` `list` `get` `update` `delete` `iter` |
| `client.calls` | `create` (outbound) `list` `get` `iter` |
| `client.campaigns` | `create` `launch` — voice batch campaigns with scheduling windows |
| `client.phoneNumbers` | `import` `list` `update` `delete` `setMonitor` `getMonitor` `setWebCalls` `getWebCalls` |
| `client.sms` | `send` + `campaigns.create/launch/list/get/delete` |
| `client.keys` | `rotate` (Stripe-style: key_id stays, secret rotates) |
| `client.usage` | `get` — minutes, calls, SMS, balance |
| `client.webhooks` | `set` `get` `delete` — per-number post-call webhooks (2 slots) |
| `Nixflex.createKey()` | static — signup without auth |

## Errors — typed, catchable by class

```js
import { NixflexRateLimitError, NixflexPaymentRequiredError } from 'nixflex';

try {
  await client.calls.create({ ... });
} catch (e) {
  if (e instanceof NixflexRateLimitError) {
    console.log(`Rate limited — retry in ${e.retryAfterSeconds}s`);
  } else if (e instanceof NixflexPaymentRequiredError) {
    console.log('Top up your balance');
  }
  // Every error carries: status, code, type, message, docUrl, details, requestId
}
```

## Built in

- **Read-only retries** — GET retries are bounded and honour `Retry-After`. POST/PUT/PATCH/DELETE never repeat automatically, including 429, network failures and 5xx. A lost or malformed change reply raises `NixflexOutcomeUnknownError` (`outcome: 'unknown'`, `safe_to_retry: false`): check the result before retrying. This local change is not published yet.
- **Pagination iterators** — `for await (const call of client.calls.iter()) { ... }`
- **TypeScript types for every request and response** — generated from the [API docs](https://docs.nixflex.com)
- **Timeouts + AbortSignal support** per client or per request
- **Zero runtime dependencies** — native fetch, Node 18+

## Verifying webhooks

Nixflex signs every webhook delivery with an `X-Nixflex-Signature` header. Verify it before trusting a payload — pass the **raw** request body, not a re-serialized object:

```js
import express from 'express';
import { verifyWebhookSignature } from 'nixflex';

const app = express();

app.post('/nixflex/calls', express.raw({ type: 'application/json' }), (req, res) => {
  const ok = verifyWebhookSignature(
    req.body,                                  // raw Buffer
    req.get('x-nixflex-signature'),
    process.env.NIXFLEX_KEY_SECRET             // the nxfs_... half of your key
  );
  if (!ok) return res.sendStatus(400);

  const event = JSON.parse(req.body.toString('utf8'));
  // handle event.event === 'call.completed'
  res.sendStatus(200);
});
```

Returns `false` for a tampered body, wrong secret, malformed header, or a signature older than the tolerance window (300 seconds; override with `{ toleranceSeconds }`). It never throws.

## Deleting call data

```js
await client.calls.delete(callId);   // one call: record, transcript, recording
await client.calls.deleteAll();      // everything on the key
```

Both are immediate and irreversible — fetch anything you need to keep first.

## Docs

### Local unpublished Group 2: number reads

`client.phoneNumbers.get(number)` reads all safe saved settings, `source`,
`web_calls_effective` and `telnyx_key_status`. No credentials/internal IDs.
`phoneNumbers.list({agent_id, provider, limit, cursor})` opts into paging with
limit/cursor; count remains returned rows. Follow next_cursor until null, keeping
account/filters unchanged. Legacy list and dedicated monitor/web-calls methods stay.

All seven PATCH switches are typed booleans: `inbound_enabled`, `outbound_enabled`,
`sms_reply_enabled`, `web_agent_enabled`, `web_calls_enabled`,
`web_functions_enabled`, `monitor_enabled`. Website voice needs Web agent ON;
the saved voice switch is not erased when Web agent is OFF. Effective eligibility
does not bypass active-account/agent/billing checks. Website custom functions
are public to visitors when enabled (default OFF). Monitoring eligibility alone
does not attach a listener or incur its premium. `source` is descriptive/read-only.

CLI: `numbers get +12025550100 --json`; `numbers list --limit 1 --provider telnyx --json`.
Use `numbers update <number> --set web_agent_enabled=true` (and the other boolean
names above); omitted fields remain unchanged. Existing commands still work.
These are local additions, not a new npm publication.

## Local Area 3 batch 1 candidate (not published)

Single-call CLI `--var name=Sam` fills `{{name}}` via `dynamic_vars`. Node uses
`dynamic_vars` directly. CLI JSON can use `variables` as a compatibility alias;
do not combine aliases or combine them with `--var`. Ambiguity fails before HTTP.
Campaign recipient `variables` is unchanged. Prompts can be retained in call data.

`calls.iter(200)` pages beyond 200 records, including a full final page. Sizes
outside whole numbers 1–200 fail before any request. Offset paging is not a snapshot.
The existing GET-only bounded retry rule remains: changes never automatically
repeat; an uncertain outcome means check before retrying. Guarded call deletion
can refuse cleanup and is not a promise of instant account/SMS/all-copy erasure.

Full API reference: **https://docs.nixflex.com**

Release history: [CHANGELOG.md](CHANGELOG.md). Licensed under [MIT](LICENSE).
