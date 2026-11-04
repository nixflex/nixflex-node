import Nixflex, {Booking, CallCompletedBookingEvent, SmsBookingEvent, GoogleCalendarSettingsPatch,
  GoogleCalendarStatus, NumberCredentials, NixflexCalendarError, GoogleCalendarErrorCode} from '../dist/index';
const c=new Nixflex({apiKey:'fixture:fixture'});
const patch:GoogleCalendarSettingsPatch={send_invites:false,slot_minutes:45,hours:{monday:['09:00','17:00'],tuesday:null,wednesday:null,thursday:null,friday:null,saturday:null,sunday:null}};
const state:Promise<GoogleCalendarStatus>=c.integrations.getGoogleCalendar('+12025550123');
c.integrations.updateGoogleCalendarSettings('+12025550123',patch);
const pair:NumberCredentials={telnyx_api_key:'fixture',telnyx_connection_id:'fixture'};
c.phoneNumbers.updateCredentials('+12025550123',pair);
const b:Booking={action:'created',booking_uid:null,start:null,end:null,attendee_name:null,attendee_email:null,service:123,timezone:null};
const call:CallCompletedBookingEvent={event:'call.completed',bookings:[b],call_id:'fixture'};
const sms:SmsBookingEvent={event:'sms.booking',booking:{...b,service:'appointment'}};
const code:GoogleCalendarErrorCode='invalid_send_invites';
// @ts-expect-error only approved slot durations
c.integrations.updateGoogleCalendarSettings('n',{slot_minutes:20});
// @ts-expect-error booleans never string-coerced
c.integrations.updateGoogleCalendarSettings('n',{send_invites:'false'});
// @ts-expect-error mixed carriers forbidden
const mixed:NumberCredentials={...pair,twilio_sid:'fixture',twilio_token:'fixture'};
// @ts-expect-error lookup duplicates are not mutation events
const duplicate:Booking={...b,action:'already_exists'};
