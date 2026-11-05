import type { Booking } from './booking.js';
import type { OutboundCallParams } from './calls.js';

export interface CallBookingTimeline extends Booking { booking_uid: string; at: string }
export interface CallBookingFinal extends Omit<Booking, 'action'> {
  booking_uid: string;
  status: 'active' | 'cancelled';
}
/** This call's retained booking result, not current calendar inventory. */
export interface CallBookingResult {
  event: 'call.bookings';
  call_id: string;
  agent_id: string | null;
  from: string | null;
  to: string | null;
  number: string | null;
  ended_at: string | null;
  timeline: CallBookingTimeline[];
  final: CallBookingFinal[];
}
export type CallBookings = { call_id: string; state: 'ready'; result: CallBookingResult }
  | { call_id: string; state: 'none' | 'processing' | 'deleted' | 'unavailable'; result: null };
export type OutboundRequestState = 'pending' | 'accepted' | 'rejected' | 'unknown';
export interface OutboundCallRequest {
  request_id: string;
  state: OutboundRequestState;
  call_id: string | null;
  reason: string | null;
}
export type PreparedOutboundCall = OutboundCallParams & { request_id: string };
/** POST acceptance is not a connected/completed call. A replay has no to/from fields. */
export interface OutboundRequestReceipt {
  call_id: string;
  request_id: string;
  status: 'initiated';
  replayed?: true;
  request_status?: 'unconfirmed';
  safe_to_retry?: false;
  to?: string;
  from?: string;
  [receiptField: string]: unknown;
}
