# K6 examples — Node 0.11.0 / Python 0.4.0 / MCP 0.5.0

Examples are not an instruction to perform a live write. Use your owned number and explicit environment; no keys or carrier secrets belong in source, terminal arguments or chat. API authentication is NIXFLEX_API_KEY. The read-only smoke is separate.

## Node / TypeScript

```ts
import Nixflex, {NixflexDoNotContactError, NixflexInvalidRequestError,
  type Booking, type CallCompletedBookingEvent, type SmsBookingEvent} from 'nixflex';
const client = new Nixflex({apiKey:process.env.NIXFLEX_API_KEY!, baseUrl:process.env.NIXFLEX_BASE_URL!});
const number = '+12025550123'; // fictional example; replace with your owned number
const consent = await client.integrations.connectGoogleCalendar(number, 'https://app.example.test/calendar-return');
// Present consent.url privately to the human; never auto-open or log it.
const status = await client.integrations.getGoogleCalendar(number);
if (status.needs_reconnect) { /* Request fresh human consent, not a silent reconnect. */ }
const settings = await client.integrations.updateGoogleCalendarSettings(number, {
  timezone:'America/New_York', slot_minutes:30, calendar_id:'primary', send_invites:false,
  hours:{monday:['09:00','17:00'],tuesday:['09:00','17:00'],wednesday:['09:00','17:00'],
    thursday:['09:00','17:00'],friday:['09:00','17:00'],saturday:null,sunday:null}
});
// Only on a separate, deliberate disconnect request:
await client.integrations.disconnectGoogleCalendar(number);
// Sensitive routing change. Read values from a privately configured process, never log.
const receipt = await client.phoneNumbers.updateCredentials(number, {
  twilio_sid:process.env.NIXFLEX_TWILIO_SID!,twilio_token:process.env.NIXFLEX_TWILIO_TOKEN!
});
try {
  await client.sms.send({agent_id:'your-agent-id',from_number:number,to:'+12025550124',message:'Requested information'});
} catch (error) {
  if (error instanceof NixflexDoNotContactError) { /* Stop; do not resend or remove suppression. */ }
  else if (error instanceof NixflexInvalidRequestError) { /* Retain old 400 validation/suppression handling. */ }
  else throw error;
}
function bookingPart(event: CallCompletedBookingEvent | SmsBookingEvent): Booking[] {
  // Call only AFTER the existing verifier has checked the original raw webhook body.
  return event.event === 'call.completed' ? event.bookings : [event.booking];
}
```

Telnyx uses the same updateCredentials method with only `{telnyx_api_key:process.env.NIXFLEX_TELNYX_API_KEY!,telnyx_connection_id:process.env.NIXFLEX_TELNYX_CONNECTION_ID!}`. Never mix pairs or send provider in the body. Type assertions are not runtime secret validation; the method rejects missing/invalid pairs without HTTP.

## Python sync and async

```python
import os
from nixflex import (Nixflex, AsyncNixflex, NixflexDoNotContactError,
                     NixflexInvalidRequestError, Booking, CallCompletedBookingEvent, SmsBookingEvent)
number = '+12025550123'
config = dict(api_key=os.environ['NIXFLEX_API_KEY'],base_url=os.environ['NIXFLEX_BASE_URL'])
with Nixflex(**config) as client:
    consent = client.integrations.connect_google_calendar(number, 'https://app.example.test/calendar-return')
    # Present the short-lived link privately to a human; never print it to logs.
    status = client.integrations.get_google_calendar(number)
    settings = client.integrations.update_google_calendar_settings(number, send_invites=False)
    # Separate deliberate disconnect:
    client.integrations.disconnect_google_calendar(number)
    receipt = client.phone_numbers.update_credentials(number,
        telnyx_api_key=os.environ['NIXFLEX_TELNYX_API_KEY'],
        telnyx_connection_id=os.environ['NIXFLEX_TELNYX_CONNECTION_ID'])
    try:
        client.sms.send(agent_id='your-agent-id',from_number=number,to='+12025550124',message='Requested information')
    except NixflexDoNotContactError:
        pass  # Stop; nothing sent. Do not retry or bypass opt-out.
    except NixflexInvalidRequestError:
        pass  # Existing old-server 400 handling; not all validation failures mean opt-out.

async def read_status():
    async with AsyncNixflex(**config) as client:
        return await client.integrations.get_google_calendar(number)
# Every other method has the same arguments and is awaited in AsyncNixflex.

def booking_part(event):
    # Only after raw-body signature verification. TypedDict is not authentication.
    return event['bookings'] if event['event'] == 'call.completed' else [event['booking']]
```

## CLI (PowerShell-safe argument shapes)

Privately configure NIXFLEX_API_KEY, NIXFLEX_BASE_URL and the selected carrier pair. These command lines contain no secret values. These are independent actions, not one recommended sequence.

```powershell
nixflex integrations connectGoogleCalendar '+12025550123' --return-url 'https://app.example.test/calendar-return' --confirm
nixflex integrations getGoogleCalendar '+12025550123' --json
nixflex integrations updateGoogleCalendarSettings '+12025550123' --body '@calendar-settings.json' --confirm
nixflex integrations disconnectGoogleCalendar '+12025550123' --confirm
nixflex numbers updateCredentials '+12025550123' --provider twilio --confirm --json
# Alternative: a trusted local secret-manager process pipes the exact JSON pair to stdin:
# <private secret-manager command> | nixflex numbers updateCredentials '+12025550123' --provider telnyx --credentials-stdin --confirm
```

calendar-settings.json contains settings only, e.g. `{"send_invites":false}`; never carrier credentials. Omit --confirm to preview without a request. Credential commands reject --body, --key and secret flags before the argument parser can echo values. SMS --json errors expose status/type/code: stop on 409 do_not_contact; retain old 400 handling. Webhook types do not add a CLI listener or ingest endpoint.

## MCP — five additions, 94 total

Ask the human to approve the exact number/change before using confirm:true. Credentials are preconfigured privately in the SERVER process environment, never tool arguments or chat. Missing configuration sends nothing. Existing 89 tools retain their original safeguards.

| Tool | Arguments example | Result |
| --- | --- | --- |
| connect_google_calendar | `{ "phone_number":"+12025550123", "return_url":"https://app.example.test/calendar-return", "confirm":true }` | Consent url + expires_at; human opens it |
| get_google_calendar | `{ "phone_number":"+12025550123" }` | Six status fields including needs_reconnect and send_invites |
| update_google_calendar_settings | `{ "phone_number":"+12025550123", "send_invites":false, "confirm":true }` | Safe settings, false preserved |
| disconnect_google_calendar | `{ "phone_number":"+12025550123", "confirm":true }` | ok:true, connected:false; no claim of remote revoke |
| update_phone_number_credentials | `{ "phone_number":"+12025550123", "provider":"twilio", "confirm":true }` | Number, provider, updated:true only |

All new writes without confirmation return confirmation_required:true, sent:false. Google settings accepts the same fields as Node/Python, including the seven-day hours object above. Use provider telnyx for the alternate private environment pair. No bulk deletion, signup, suppression removal, campaign resume/consent or hidden-write Knowledge draft tool is added.

MCP SMS errors use `error.status=409`, `error.type=conflict`, `error.code=do_not_contact`; report that nothing was sent and stop. Older 400 invalid_request remains generic. The shipped booking schema can validate the booking part of an authenticated webhook locally:

```js
import {callCompletedBookingSchema, smsBookingSchema} from 'nixflex-mcp/k6-schemas.js';
// verifiedEvent is supplied only after existing raw-body signature verification.
function parseBookingEvent(verifiedEvent) {
  return verifiedEvent.event === 'call.completed'
    ? callCompletedBookingSchema.parse(verifiedEvent) : smsBookingSchema.parse(verifiedEvent);
}
```

No MCP webhook-receiver tool is registered. Booking required keys: action, booking_uid, start, end, attendee_name, attendee_email, service, timezone. Preserve null; service can be numeric. Never count internal already_exists lookups as mutations.
