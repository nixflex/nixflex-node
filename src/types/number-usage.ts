export type NumberUsagePeriod = 'today' | '7' | '14' | '30' | '90' | 'all';
export interface NumberUsageParams {
  /** Calendar days including today; default all (retained history). */
  period?: NumberUsagePeriod;
  /** IANA zone, e.g. Europe/London; default UTC. Match the dashboard browser zone. */
  time_zone?: string;
}
export interface NumberUsage {
  phone_number: string;
  period: NumberUsagePeriod;
  time_zone: string;
  /** null for all retained history; otherwise inclusive ISO timestamp. */
  period_start: string | null;
  /** Inclusive server snapshot cutoff, not the future end of the calendar day. */
  period_end: string;
  start_inclusive: true;
  end_inclusive: true;
  currency: 'USD';
  duration_unit: 'milliseconds';
  call_count: number;
  total_ms: number;
  /** total_ms / 60000 rounded to six decimal places; total_ms is authoritative. */
  minutes: number;
  last_call: string | null;
  /** Exact decimal string of recorded call charges, not estimated/repriced costs. */
  total_cost: string;
  unpriced_calls: number;
  sms_sent: number;
  sms_received: number;
  sms_count: number;
  web_chats: number;
  /** Zero calls AND zero SMS in this period; web chat does not affect unused. */
  unused: boolean;
  history_note: string;
}
export interface NumberUsageResponse { usage: NumberUsage }
