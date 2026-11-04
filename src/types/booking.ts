/** Shared public mutation evidence. Duplicate lookups are not booking events. */
export interface Booking {
  action: 'created' | 'rescheduled' | 'cancelled';
  booking_uid: string | null;
  start: string | null;
  end: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  service: string | number | null;
  timezone: string | null;
}
/** The booking part of the flat call.completed webhook; other fields remain available. */
export interface CallCompletedBookingEvent {
  event: 'call.completed';
  bookings: Booking[];
  [key: string]: unknown;
}
export interface SmsBookingEvent {
  event: 'sms.booking';
  booking: Booking;
  [key: string]: unknown;
}
