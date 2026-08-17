# Nixflex Node.js SDK

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

- **Automatic retries** — 429s retried honouring `Retry-After`; network failures retried; POST never blind-retries a 5xx (no double dials)
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

Full API reference: **https://docs.nixflex.com**

Release history: [CHANGELOG.md](CHANGELOG.md). Licensed under [MIT](LICENSE).
