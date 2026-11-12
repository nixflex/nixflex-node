# B57 content deletion — unpublished K9 candidates

Node/CLI 0.11.0, Python 0.4.0 and MCP 0.5.0. MCP has 97 tools. This change does not publish anything.

| Operation | Node | Python sync / async | CLI | MCP |
|---|---|---|---|---|
| Call | client.calls.delete(id) | client.calls.delete(id), await on AsyncNixflex | nixflex calls delete ID --confirm | delete_call with call_id and confirm:true |
| Voice campaign | client.campaigns.delete(id) | client.campaigns.delete(id), await on AsyncNixflex | nixflex campaigns delete ID --confirm | delete_campaign with campaign_id and confirm:true |
| SMS campaign | client.sms.campaigns.delete(id) | client.sms.campaigns.delete(id), await on AsyncNixflex | nixflex sms campaigns delete ID --confirm | delete_sms_campaign with campaign_id and confirm:true |

One DELETE per invocation. Never an automatic retry. SDK mutations require the application's deliberate authorization. The new voice CLI command and all three MCP content-delete tools preview locally with zero requests unless confirmed.

Calls end before their content is deleted. Success returns call_id, deleted:true, recording_deleted (boolean) and recording_cleanup (carrier_best_effort or queued). These fields do not prove every external recording copy is erased.

Campaign deletion cancels waiting work, ends running calls and hides the campaign. History and used charges remain; no refunds, and sent SMS cannot be recalled. Success returns campaign_id, deleted:true and message:"Campaign deleted". Owner/Admin only; missing/foreign resources return 404, including already absent resources. The kits never turn 404 into invented success. A previously hidden but still tracked owned item can return the same successful receipt on a deliberate repeat; hidden does not mean physically absent.

HTTP 503 with error.code hangup_pending and error.details {deleted:false,retry_pending:true} means the server queued deletion and finishes once hang-up is confirmed. Node/Python raise NixflexServerError with that exact status/code/details; CLI/MCP report a structured error, never success. A later deliberate repeat of the same DELETE is safe; the kit does not repeat it or poll automatically.

Other 5xx, lost replies or invalid JSON remain outcome_unknown: inspect the outcome before a deliberate retry. HTTP status and server details survive; the original server code is in details.original_code when uncertainty wrapping applies. Known 403/404 retain their exact code/details. No synthetic successful receipt is created. The three MCP tools require the matching ID and full documented success receipt; empty, incomplete or wrong-ID replies remain uncertain. Existing SDK methods continue passing valid JSON through; callers should require the documented deleted:true receipt rather than treating an arbitrary JSON object as proof.

Bulk calls.deleteAll() / calls.delete_all() / nixflex calls delete-all --confirm remains a separate guarded cleanup route with deleted/calls_deleted/recordings_deleted/sms_deleted counters. It is not account or SMS erasure and does not use B57's single-item queue classification. Bulk deletion stays outside MCP for safety.

Use fresh list/detail reads to inspect current server state. The kits do not cache deletion, hide rows locally or erase retained billing/history evidence. A deleted/retained stub and a 404 are returned as the API reports them.

```js
// Using an already configured client; authorize the exact campaign first.
try {
  const receipt = await client.campaigns.delete(campaignId);
  if (receipt.deleted !== true) throw new Error('Deletion is not confirmed');
} catch (error) {
  if (error.status === 503 && error.code === 'hangup_pending' &&
      error.details.deleted === false && error.details.retry_pending === true) {
    // Show "Deletion queued". Do not send another request automatically.
  } else { throw error; }
}
```

```python
from nixflex.errors import NixflexServerError

# Use await client.campaigns.delete(campaign_id) with AsyncNixflex.
try:
    receipt = client.campaigns.delete(campaign_id)
    if receipt.get("deleted") is not True:
        raise RuntimeError("Deletion is not confirmed")
except NixflexServerError as error:
    if (error.status == 503 and error.code == "hangup_pending"
            and error.details.get("deleted") is False and error.details.get("retry_pending") is True):
        pass  # Show "Deletion queued"; do not repeat automatically.
    else:
        raise
```
