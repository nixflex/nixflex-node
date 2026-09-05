// ============================================
// src/types/callers.ts
// Caller context - what your agent knows about a caller on one of your numbers.
// One record per (your number, caller number). Docs: /concepts/caller-context
// ============================================

/** The six fields a developer may set. Omitted = kept; null = removed. */
export interface CallerContextSetParams {
  /** Full name - first and last. */
  name?: string | null;
  email?: string | null;
  /** A contact number other than the one they call from. */
  phone?: string | null;
  /** Free text - city, area or postal code. */
  location?: string | null;
  /** An account, order or booking reference the caller uses. */
  reference_id?: string | null;
  /** A short preference, e.g. "prefers morning appointments". */
  preference?: string | null;
}

/** The record as returned. Only fields with a value are present. */
export interface CallerContextFields {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  reference_id?: string;
  preference?: string;
  /** Engine-written: what the caller wanted on their last call - never what happened. */
  last_call?: string;
  /** Engine-written: something still pending for the caller. */
  open_item?: string;
}

export interface CallerContext {
  phone_number: string;
  caller_number: string;
  context: CallerContextFields;
}

export interface CallerContextResponse {
  caller: CallerContext;
}

export interface CallerContextDeleteResponse {
  phone_number: string;
  caller_number: string;
  deleted: true;
}

export interface CallerImportRow extends CallerContextSetParams {
  /** The caller's number in E.164 form. */
  caller_number: string;
}

export interface CallerImportResponse {
  phone_number: string;
  imported: number;
}
