# Organisation and integration settings

Use the account API key privately. It has Owner authority. These kits do not
accept a teammate's dashboard session or impersonate a role.

| Kit | Entry point |
| --- | --- |
| Node | client.organisation, client.integrations |
| CLI | nixflex organisation, nixflex integrations |
| Python sync/async | client.organisation, client.integrations |
| MCP | See KITS-COVERAGE.md for included tools and deliberate exceptions |

Organisation reads: get, members, activity. JSON activity accepts before, actor,
from, to; Python spells from as from_. Dates are inclusive UTC calendar dates,
clamped to retained history. IDs and next_cursor are strings; never parse them as
floating-point numbers. Continue JSON pages with next_cursor as before until null.

Node activityCsv and Python activity_csv stream CSV bytes. Python async usage is
async for, not await. The server reads 500 rows per database chunk and rechecks
authority each chunk. Closing/stopping early must close/aclose the iterator.
Discard partial output after any error. Streaming never automatically restarts
after yielding data. The CLI activityCsv --output FILE publishes the file only
after completion and never overwrites an existing file.

Organisation changes: invite, claimInvite/claim_invite, resend, revoke,
removeMember/remove_member, setRole/set_role, rename. Personal acceptance, leave,
ownership transfer and closure stay dashboard only. A sent invitation means
provider acceptance, not delivery to the inbox. A resent invite replaces the old
link. A membership 202/live_disconnect_pending means the change committed but
live disconnection is unconfirmed; do not repeat the membership change blindly.

Personal dashboard rules still apply there: Members cannot manage team/settings;
Admins have permitted Member-management/settings rights but cannot manage Admins,
rename the organisation, access keys, transfer ownership or close the account.
The API key is Owner authority, so these kits cannot test personal Admin/Member
access. Server refusals remain typed errors.

Integration get/set/delete supports only calcom, slack, zapier, make, gohighlevel,
webhook, webhook2, precall, web-calls. Use getAgentPrecall/setAgentPrecall/
deleteAgentPrecall (snake_case in Python) for the agent default. Number pre-call
overrides the default; removing the override can expose the default again.

Provider PUT replaces stored configuration. Supply required credentials privately;
omitted options reset to documented server defaults. Optional agent_id is only a
fallback when the number has no assigned agent; it does not move the number.
Web-call reads return the saved flag, not proof of effective availability.

Functions use listFunctions/createFunction/updateFunction/deleteFunction
(snake_case in Python). At most 15 per number; names are lowercase snake_case,
maximum 64 characters; default method POST. timeout_ms defaults to 5000 and is
clamped server-side to 1000..45000. PATCH only changes supplied fields; null
speak_during clears it; an empty PATCH is refused. Reads expose has_headers,
never the header values. Empty lists and successful no-op deletes are not proof
of ownership or previous existence.

SDKs return exact wire data without logging it. URLs can contain credentials:
never print full integration responses. Use private body files/environment input.
CLI display omits URLs, credential fields and free-form configuration, including
webhook get/delete previews. Signing-secret retrieval is a private human action,
not a kit method. Do not paste credential settings into an AI conversation.

Every NEW CLI/MCP write needs explicit confirmation before any HTTP request.
SDK writes are explicit method calls. Only GET may retry, with a bounded budget.
Unknown write outcomes stay outcome_unknown / safe_to_retry:false: read current
state before deciding whether to retry manually.

K4-TEST.ps1 is read-only and uses built packages. It refuses every mutation at its
transport boundary. Successful writes require a separately authorised manual test
on disposable resources; never use the protected production/testing numbers.
