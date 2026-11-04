# K6 number features — 4 November 2026

Engine contract: deb63749acc74fe5d1d840dbf3589b2c40b5627e (B50/B50b/B51/B52). No engine changes. Public Cal.com methods remain unchanged.

| HTTP operation (number is URL-encoded E.164) | Node / CLI command | Python sync + async | MCP |
| --- | --- | --- | --- |
| POST /v1/integrations/google-calendar/number/{number}/connect | integrations.connectGoogleCalendar / integrations connectGoogleCalendar | integrations.connect_google_calendar | connect_google_calendar |
| GET /v1/integrations/google-calendar/number/{number} | integrations.getGoogleCalendar / integrations getGoogleCalendar | integrations.get_google_calendar | get_google_calendar |
| DELETE /v1/integrations/google-calendar/number/{number} | integrations.disconnectGoogleCalendar / integrations disconnectGoogleCalendar | integrations.disconnect_google_calendar | disconnect_google_calendar |
| PATCH /v1/integrations/google-calendar/number/{number} | integrations.updateGoogleCalendarSettings / integrations updateGoogleCalendarSettings | integrations.update_google_calendar_settings | update_google_calendar_settings |
| POST /v1/phone-numbers/{number}/credentials | phoneNumbers.updateCredentials / numbers updateCredentials | phone_numbers.update_credentials | update_phone_number_credentials |

## Calendar contract

Connect sends only `{return_url}` and returns `{url, expires_at}`. A human opens the short-lived Google consent link; the kits never open a browser. It contains OAuth state, not access/refresh tokens: do not log or redistribute it. HTTPS return URLs must have no credentials, fragment, whitespace, backslash, localhost or OAuth code/state/token query parameters. Custom application schemes need the server's account allowlist.

After consent, the engine redirects with `status=connected&phone_number=...`, or `status=error&code=...`. Query status again; a redirect is not a substitute for checking current state. Links last ten minutes.

GET returns exactly `connected`, nullable `account_email`, `calendar_id`, nullable `connected_at`, `needs_reconnect`, `send_invites`. `connected:true` plus `needs_reconnect:true` needs new consent. The GET can refresh provider credentials inside the engine; it does not connect a new account or change calendar settings.

PATCH sends a nonempty subset of `timezone`, `hours`, `slot_minutes`, `calendar_id`, `send_invites`. Omitted fields preserve saved values. `send_invites` is a strict boolean; false is retained, absent stored value defaults true. It controls Google's invitation request, not delivery proof. `timezone` is an IANA name (max 100 chars). `slot_minutes` is 15, 30, 45 or 60. `calendar_id` is nonblank, max 1024, no whitespace/control characters; `primary` selects the main calendar.

When supplying `hours`, include all seven lowercase weekday names; each is null (closed) or `["09:00","17:00"]`. Times are HH:MM, close after open, no overnight interval. PATCH returns the five safe settings. DELETE returns `{ok:true,connected:false}`; remote revocation is best effort and may protect shared connections. Do not claim remote removal or recall already dispatched bookings.

SDK errors: `NixflexCalendarError`, `NixflexCredentialError`; inspect status/code, not raw text. All known engine codes remain exact. Private response details are replaced by safe messages. Unknown future codes become `request_failed`; a known uncertain write is never represented as success. Exported calendar codes include invalid_return_url, number_not_found, already_connected, booking_provider_conflict, not_connected, agent_not_assigned, invalid_settings, invalid_timezone, invalid_hours, invalid_slot_minutes, invalid_calendar_id, invalid_send_invites, calendar_unavailable, expired_link, not_configured, guard_unavailable. MCP returns a structured error with type/code/status and safe details.

## Carrier details

Supply exactly `{twilio_sid,twilio_token}` OR `{telnyx_api_key,telnyx_connection_id}` for the number's current carrier; no provider field goes on the HTTP wire. The number, settings and history remain in place. This is a sensitive carrier routing change; Telnyx can require fresh verification. SDK callers supply the pair privately in memory. CLI uses the fixed environment names below or bounded JSON stdin; never credentials in arguments or files. MCP's schema accepts only phone_number, provider and confirm; it reads the selected pair privately from its process environment only AFTER confirmation. Never paste secrets into an assistant conversation.

- Twilio: NIXFLEX_TWILIO_SID + NIXFLEX_TWILIO_TOKEN.
- Telnyx: NIXFLEX_TELNYX_API_KEY + NIXFLEX_TELNYX_CONNECTION_ID.
- CLI/API authentication: NIXFLEX_API_KEY, separate from carrier credentials.

The only success output is `{phone_number,provider,updated:true}`. CLI writes require --confirm; MCP writes require confirm:true. Without it, zero requests and zero credential reads. A Desktop host must privately provide these environment variables to its server process; the bundle adds no secret input form. If it cannot, use the CLI/SDK instead. Missing private configuration returns credentials_not_configured and sends nothing.

Known errors: invalid_request, invalid_credentials, number_not_found, number_not_in_account, account_unavailable, carrier_mismatch, number_operation_pending, number_release_pending, carrier_unavailable, credential_update_unavailable, carrier_outcome_unknown, credential_save_pending. A safe UUID operation_id is retained when supplied; no input, response body, token or private URL is echoed.

`carrier_outcome_unknown`: routing is unconfirmed; contact support before retrying. `credential_save_pending`: carrier change is confirmed but database saving is pending; manually retry with EXACTLY the same details to finish saving. Never automatically repeat a write, including 429, 503, malformed success or lost connection. Uncertain writes carry safe_to_retry:false. SDK API keys retain normal owner/active checks; these clients cannot bypass the server's ownership/busy guards.

## SMS suppression compatibility

New response: HTTP 409, type `conflict`, code `do_not_contact`. Node/Python raise NixflexDoNotContactError (a NixflexConflictError); MCP/CLI retain the structured status/type/code. The message was not sent. Stop: never remove suppression or retry to bypass it. Older servers may return 400 invalid_request; retain the application's legacy handling as well, but do not classify every 400 as suppression. There is no automatic SMS retry. Campaign holds remain separate.

## Booking webhook model

Node/Python export Booking, CallCompletedBookingEvent and SmsBookingEvent. MCP ships bookingSchema, callCompletedBookingSchema and smsBookingSchema in k6-schemas.js (models, not extra tools). Verify the original raw-body webhook signature first using the existing verifier; these models do not authenticate a delivery.

Required booking keys: action (`created`/`rescheduled`/`cancelled`), booking_uid, start, end, attendee_name, attendee_email, service, timezone. Every field except action can be null; service can also be a string or number. Do not turn null into fabricated dates or attendee data. The flat call.completed event has bookings[], sms.booking has booking. Duplicate `already_exists` lookup is internal and is NOT a public booking mutation. Event models describe the booking part; other existing envelope fields remain available. No webhook receiver or listener is added.

See KIT-EXAMPLES-K6.md in the K6 handoff for all SDK/CLI/MCP examples. Live successful writes and human consent remain manual checks; offline tests use fakes only.
