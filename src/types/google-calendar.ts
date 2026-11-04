export type CalendarDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
/** All seven days are required when hours is supplied. No overnight interval. */
export type CalendarHours = Record<CalendarDay, [string, string] | null>;
export interface GoogleCalendarSettings {
  timezone: string;
  hours: CalendarHours;
  slot_minutes: 15 | 30 | 45 | 60;
  calendar_id: string;
  send_invites: boolean;
}
/** Supply only changed fields. Omission keeps the saved setting; null does not clear. */
export type GoogleCalendarSettingsPatch = Partial<GoogleCalendarSettings>;
export interface GoogleCalendarStatus {
  connected: boolean;
  account_email: string | null;
  calendar_id: string;
  connected_at: string | null;
  needs_reconnect: boolean;
  send_invites: boolean;
}
export interface GoogleCalendarConnect { url: string; expires_at: string }
export interface GoogleCalendarDisconnect { ok: true; connected: false }
/** Supply privately from environment or a secret manager; never log this object. */
export type NumberCredentials =
  | { twilio_sid: string; twilio_token: string; telnyx_api_key?: never; telnyx_connection_id?: never }
  | { telnyx_api_key: string; telnyx_connection_id: string; twilio_sid?: never; twilio_token?: never };
export interface NumberCredentialsUpdated { phone_number: string; provider: 'twilio' | 'telnyx'; updated: true }
