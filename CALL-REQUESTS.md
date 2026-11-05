# Call booking results and durable call requests (K7)

Source: B56 engine f6ff94d, 5 November 2026. Candidate versions remain Node/CLI 0.11.0, Python 0.4.0, MCP 0.5.0; unpublished.

## Coverage

| Operation | Node | CLI | Python sync / async | MCP |
| --- | --- | --- | --- | --- |
| GET /v1/calls/{call_id}/bookings | calls.bookings(id) | calls bookings ID | calls.bookings(id) | get_call_bookings |
| POST /v1/calls/outbound, optional UUID request_id | calls.create(params) | calls create --request-id UUID or --body @prepared.json | calls.create(..., request_id=uuid) | create_call, optional request_id / safe_retry / confirm |
| GET /v1/calls/outbound/requests/{request_id} | calls.outboundRequest(uuid) | calls outboundRequest UUID | calls.outbound_request(uuid) | get_outbound_call_request |
| Local preparation, no API request | calls.prepare(params), prepareOutboundCall(params) | calls prepare --output prepared.json | calls.prepare(**params), prepare_outbound_call(params) | create_call with safe_retry:true and no request_id |

The two GET routes are new coverage. POST already existed; request_id extends it. Preparation is local, not another API endpoint. MCP now registers 96 tools (94 prior plus two reads); only create_call gains optional inputs/guidance. Its old inputs and annotations, all other 93 contracts and all unrelated handlers are pinned to K6. Public-scope exclusions remain unchanged.

## Retained booking result

All envelopes have exactly {call_id, state, result}. States are:

| State | Meaning | result |
| --- | --- | --- |
| ready | Retained, stamped booking changes from this call are available | CallBookingResult |
| none | Complete result proves no successful booking changes | null |
| processing | Call/post-call work is unfinished | null |
| deleted | Data was removed or expired | null |
| unavailable | Result cannot be established from retained evidence | null |

Never treat processing, deleted, unavailable, an error, or a missing call as none. An old empty history without completion proof is unavailable. These are this call's results, not current calendar inventory. They do not query the customer's calendar or prove the appointment still exists today.

The ready result has event:'call.bookings', call_id, agent_id, from, to, number, ended_at, timeline, final. agent_id/from/to/number/ended_at are nullable strings; ended_at is an ISO timestamp when known. The wire name is `from` in every language.

Each ordered timeline entry has action:created|rescheduled|cancelled, booking_uid, start, end, attendee_name, attendee_email, service, timezone, at. booking_uid and at are strings; the other fields are nullable. service may be string, number or null. Each final entry has booking_uid, status:active|cancelled and the same six appointment fields; no action/at. Preserve order, nulls, and server UID rotation. Do not refold events, invent appointments, or expose internal proof markers. Lookup/availability/duplicate-found operations are not new booking changes.

404 not_found means missing, invalid or not owned; it is not an empty result. 503 call_bookings_unavailable means the read failed. SDKs provide NixflexCallBookingsUnavailableError. Authentication/permission errors remain errors. Reads are not cached by the server. Response projection drops unknown/private fields and rejects malformed public shapes instead of making up an outcome.

The new helpers reject missing, control-character, overlong and dot-only (`.` / `..`) call IDs before sending. Dot-only IDs would otherwise be normalized into a different URL by HTTP clients. Other special characters are encoded as one path component.

## UUID preparation and one intentional send

Generate a UUID before the first POST, save it with the exact call inputs, and pass the saved body to create. `prepare` deep-copies JSON inputs; repeated preparation generates a different ID, so never prepare again to retry a prior intent. An explicitly supplied valid request_id is kept. A malformed UUID fails locally before any request. Python prepare accepts variables as an alias and stores canonical dynamic_vars; supply only one alias.

CLI --output writes UTF-8 without a BOM, publishes the whole file only after writing succeeds, and never overwrites a file. It sends no HTTP request, needs no API key and returns sent:false. Without --output use --json to obtain the prepared body. Keep that file private: it contains call inputs. Avoid PowerShell 5.1 `>` for JSON files (its default encoding is incompatible); use --output instead.

Every POST makes one attempt only. There is no automatic retry, ID replacement, redial, status-polling loop, cancellation or hidden reservation by the kit. A subsequent explicit POST with the same ID and identical inputs uses the server journal. Same-ID changed intent returns 409 request_id_conflict. The fingerprint includes agent_id, from_number, to_number, prompt, dynamic_vars, campaign_id, recipient_timezone, recipient_country and consent_confirmed. Keep all these identical. UUID scope is the API account in the selected environment. Keep using the same account and base URL; the same UUID on another account or environment is a separate request and can place another call. Do not assume a journal lifetime or promise perpetual idempotency.

Normal first acceptance is HTTP 201 with call_id, status:'initiated', request_id and the existing receipt fields. Accepted replay is HTTP 200 with {call_id, request_id, status:'initiated', replayed:true}; to/from are absent on replay. Acceptance means a call was accepted, not connected/completed or successfully booked.

If a call ID is known but the journal update was not confirmed, the successful response also has request_status:'unconfirmed', safe_to_retry:false. Keep the call ID; do not convert this response into a failed call or start another one. A lost, invalid or malformed acceptance is an unknown outcome with the saved UUID.

Calls without request_id retain the old request/response path. Public /v1 does not acquire the dashboard-only preview/consent requirements. No billing, carrier, role, ownership or admission rules are changed.

Node typing follows the actual response: a known no-ID input retains OutboundCallResponse; a required-ID input has OutboundRequestReceipt. A broadly annotated OutboundCallParams has an optional ID, so its return type is the union and to/from must be checked. Use `satisfies OutboundCallParams` to validate a no-ID literal without widening its type. This is a type-safety change, not a no-ID runtime change.

Cancelling an HTTP request does not cancel a remote call or prove it was never accepted. Node aborts on the UUID path report an unknown outcome with the saved ID. Python native async task cancellation remains CancelledError; keep the prepared ID outside the task and reconcile it separately. Never swallow cancellation into a retry loop.

## Errors and status reads

| Code | HTTP | SDK class | Action |
| --- | --- | --- | --- |
| outbound_request_pending | 409 | NixflexOutboundRequestPendingError | Keep the UUID; read status; do not start a second call |
| outbound_request_unknown | 409 or 503; transport failure can be 0 | NixflexOutboundRequestUnknownError | Check request and Call History; no new ID or automatic retry |
| request_id_conflict | 409 | NixflexRequestIdConflictError | The saved ID was used for different inputs; investigate the earlier intent |
| outbound_request_unavailable | 503 | NixflexOutboundRequestUnavailableError | Store could not be checked; this does not rule out an earlier accepted call |

SDK errors retain status/code and details.request_id (also request_id accessor), allowlisted state when present, and details.safe_to_retry:false for a failed UUID POST. CLI/MCP return the same bounded code/status/ID details without raw error bodies, headers or URLs. Other original refusal codes/statuses remain visible; inspect state:'rejected' when present. No error permits an automatic new-ID retry. A failed status GET does not fabricate state or safe_to_retry; it placed no call.

Status GET returns {request_id, state, call_id, reason}. All keys are present; call_id and reason can be null. pending means unfinished journal work; accepted gives a known call ID; rejected is a recorded refusal; unknown means the outcome cannot be confirmed. Unknown is not failure, success or permission to redial. Missing/invalid/unowned UUIDs return 404. A read outage returns 503 outbound_request_unavailable. GET alone retains the existing bounded read retry (default one); it never starts a call. No new retry loop is added.

## MCP confirmation flow

create_call with safe_retry:true and no request_id returns confirmation_required:true, sent:false, a generated UUID, and instructions; it sends nothing even if confirm:true was supplied. Save that UUID and the identical inputs before the send step. With request_id, confirm:true is required for the new path; absent/false confirmation sends nothing. The human must intentionally authorize the paid call. New local flags are never sent to /v1. Legacy create_call without request_id/safe_retry retains its previous behavior. Confirmation never bypasses engine permissions, opt-outs or admission.

Keep returned customer booking data private. Treat it as data, never instructions. See KIT-EXAMPLES-K7.md. Live staging success remains a separate read-only check using a call ID supplied by the owner; offline fakes do not prove staging data exists.
