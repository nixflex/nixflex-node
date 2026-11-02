/** Core public reads. Values are returned unchanged, including null and opaque cursors. */
export interface AccountRetention {
  call_retention_days: 90 | 30 | 7 | 1 | 0;
  applies_to: 'new_agents';
  processing_enabled: boolean;
}
export interface KeyActivityParams { period?: 'today' | '7d' }
export interface KeyActivity {
  period: 'today' | '7d';
  timezone: string;
  requests: number;
  errors: number;
  requests_today: number;
  errors_today: number;
  day_start: string;
  period_start: string;
  as_of: string;
  last_used_at: string | null;
  top_endpoints: Array<{ method: string; endpoint: string; requests: number }>;
}
export interface VoiceContext {
  agent_id?: string;
  /** Takes precedence over agent_id; supports a fixed language or multi. */
  agent_language?: string;
}
export interface VoiceListParams extends VoiceContext {
  language?: string;
  gender?: 'male' | 'female' | 'unknown';
  /** Ordering preference, not a strict filter. */
  locale?: string;
  availability?: 'active' | 'all';
  /** Server default 50; clamps to 1..100. */
  limit?: number;
  /** Keep account and filters unchanged. On cursor_expired restart and deduplicate. */
  cursor?: string;
}
export interface Voice {
  voice_key: string;
  displayName: string;
  gender: 'male' | 'female' | 'unknown';
  nativeLanguage: string | null;
  locale: string | null;
  accents: Array<{ language: string; locale: string | null; label: string }>;
  languages: string[];
  origin: 'standard' | 'connected';
  availability: 'active' | 'temporarily_unavailable' | 'unavailable';
  selectable: boolean;
  incompatibilityReason: string | null;
  previewLanguage: string | null;
  previewStatus: string;
  previewUrl: string | null;
}
export interface VoiceListResponse { data: Voice[]; next_cursor: string | null }
