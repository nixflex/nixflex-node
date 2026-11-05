# K7 examples (unpublished candidates)

Set credentials privately outside code. Every example explicitly supplies a base URL; do not copy a production URL into a test. Preparation is local. Running create places a paid call: execute that line only for a human-approved call, never as an automatic retry.

## Node

```js
import Nixflex, {prepareOutboundCall, NixflexOutboundRequestError} from 'nixflex';
import {writeFileSync, readFileSync} from 'node:fs';
const client = new Nixflex({apiKey:process.env.NIXFLEX_API_KEY,
  baseUrl:process.env.NIXFLEX_BASE_URL, maxRetries:0});
// Step 1, once per NEW intent. Application must keep this private file/account binding.
const prepared = prepareOutboundCall({agent_id:'YOUR_AGENT',
  to_number:'+12025550100', from_number:'+12025550101', prompt:'Your approved call purpose'});
writeFileSync('prepared-call.json', JSON.stringify(prepared), {encoding:'utf8', flag:'wx', mode:0o600});
// Step 2, only after human authorization; never wrap this in an automatic retry loop.
const saved = JSON.parse(readFileSync('prepared-call.json','utf8'));
try {
  const receipt = await client.calls.create(saved);
  // Persist receipt.call_id, including if request_status is unconfirmed. Do not redial.
} catch (error) {
  if (!(error instanceof NixflexOutboundRequestError)) throw error;
  // Display only error.status/error.code/error.details.request_id, then reconcile.
}
// Read separately, without creating any call:
const request = await client.calls.outboundRequest(saved.request_id);
if (request.state === 'accepted' && request.call_id) {
  const bookings = await client.calls.bookings(request.call_id);
  if (bookings.state === 'ready') { /* Use timeline/final as returned. */ }
  else if (bookings.state === 'none') { /* Proven no successful booking changes. */ }
  else { /* Keep processing/deleted/unavailable distinct. */ }
}
```

For a retry decision, load the existing file; do not execute Step 1 again. SDK typed request_id callers receive OutboundRequestReceipt (to/from optional); a no-ID create retains OutboundCallResponse typing.

## CLI (PowerShell 5.1 and 7)

```powershell
# Put agent_id/to_number/from_number/prompt in a private UTF-8 intent.json.
# Local only; fails if prepared-call.json already exists. No key required.
nixflex calls prepare --body '@intent.json' --output prepared-call.json --json
# Only for the approved initial send. Key/base URL are configured privately.
nixflex calls create --body '@prepared-call.json' --base-url $env:NIXFLEX_BASE_URL --json
# Read only. These commands cannot place calls.
nixflex calls outboundRequest 'SAVED-UUID' --base-url $env:NIXFLEX_BASE_URL --json
nixflex calls bookings 'KNOWN-CALL-ID' --base-url $env:NIXFLEX_BASE_URL --json
```

Check each command's exit code before continuing; never chain prepare/create in a retry loop. A supplied --request-id UUID is also supported for create, but save the exact inputs first. CLI --json errors exit 1; inspect error.status/code/details.request_id. Never print the key or log the booking payload.

## Python sync and async

```python
import json, os
from pathlib import Path
from nixflex import Nixflex, AsyncNixflex, prepare_outbound_call, NixflexOutboundRequestError
connection = dict(api_key=os.environ['NIXFLEX_API_KEY'],
                  base_url=os.environ['NIXFLEX_BASE_URL'], max_retries=0)
# Local preparation, once for a new authorized intent; use private access permissions.
prepared = prepare_outbound_call(dict(agent_id='YOUR_AGENT', to_number='+12025550100',
    from_number='+12025550101', prompt='Your approved call purpose', variables={'name':'Example'}))
with open('prepared-call.json','x',encoding='utf-8') as file:
    json.dump(prepared,file)
saved = json.loads(Path('prepared-call.json').read_text(encoding='utf-8'))
with Nixflex(**connection) as client:
    try:
        receipt = client.calls.create(**saved)  # Paid call, human authorization required.
    except NixflexOutboundRequestError as error:
        # Keep saved ID; surface only safe code/status, reconcile instead of redialling.
        pass
    state = client.calls.outbound_request(saved['request_id'])
    if state['state'] == 'accepted' and state['call_id']:
        result = client.calls.bookings(state['call_id'])

async def inspect_saved_call(request_id):
    async with AsyncNixflex(**connection) as client:
        state = await client.calls.outbound_request(request_id)
        if state['state'] == 'accepted' and state['call_id']:
            return await client.calls.bookings(state['call_id'])
        return state
# For async sending, explicitly await client.calls.create(**saved), ONCE.
# client.calls.prepare(**params) remains a local synchronous helper even on AsyncNixflex.
```

Never regenerate the ID when reopening the process. Stop when state is unknown/pending; rejected is a refusal, not permission to blindly redial. Booking state remains independent from request acceptance.

## MCP

These are tools/call arguments, not prompts to paste a secret into an assistant:

```json
{"name":"create_call","arguments":{"agent_id":"YOUR_AGENT","to_number":"+12025550100","from_number":"+12025550101","prompt":"Your approved purpose","safe_retry":true}}
```

This returns a UUID and sends nothing. Retain it with the exact inputs. After explicit human authorization, use that returned UUID (do not use a newly generated ID):

```json
{"name":"create_call","arguments":{"agent_id":"YOUR_AGENT","to_number":"+12025550100","from_number":"+12025550101","prompt":"Your approved purpose","request_id":"RETURNED-UUID","confirm":true}}
{"name":"get_outbound_call_request","arguments":{"request_id":"RETURNED-UUID"}}
{"name":"get_call_bookings","arguments":{"call_id":"KNOWN-CALL-ID"}}
```

RETURNED-UUID/KNOWN-CALL-ID are placeholders, not valid values to execute. Unknown/pending means investigate, never allocate a replacement ID. A read-only staging smoke never invokes create_call. Two new tools bring MCP to 96; the 19 approved Knowledge tools and all earlier exclusions stay in this same install.
