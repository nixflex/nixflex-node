import type { RequestOptions } from '../client.js';
/** Keep server receipts intact; unknown additive fields are preserved. */
export interface KnowledgeObject { [key: string]: unknown }
/** B49g owned read. Counts describe returned arrays; limits are server-configured. */
export interface KnowledgeKeyterms {
  knowledge_keyterms: string[];
  knowledge_keyterms_count: number;
  knowledge_keyterms_limit: number;
  manual_keyterms: string[];
  manual_keyterms_count: number;
  /** New-edit limit; unchanged legacy manual lists may exceed it. */
  manual_keyterms_limit: number;
}
export type KnowledgeChannel = 'inbound' | 'outbound' | 'web_voice' | 'web_chat' | 'sms';
export interface KnowledgeSettings { channels?: KnowledgeChannel[]; match?: 'Strict' | 'Normal'; not_found?: string }
export interface PageQuery { limit?: number; cursor?: string }
export interface TargetQuery extends PageQuery { q?: string; target?: string }
export interface KnowledgePage { items: KnowledgeObject[]; next_cursor: string | null }
export interface RevisionInput { expected_revision: number }
export interface ScopeInput { settings?: KnowledgeSettings; expected_revision?: number }
export interface SettingsInput extends RevisionInput { settings: KnowledgeSettings }
export type EmptyInput = Record<string, never>;
export interface TextSource { type: 'text'; text: string; title?: string }
export interface SourceInput { source: TextSource; review?: boolean }
export interface SourceReplacement extends SourceInput, RevisionInput {}
export interface SourceDeletion extends RevisionInput { topic_ids: string[]; manual?: 'keep' | 'delete' }
export interface WebsiteInput { discovery_id: string; page_ids: string[]; review?: boolean }
export interface KnowledgeTopic {
  facts: string; title?: string; questions?: string[]; valid_from?: string | null; valid_until?: string | null;
}
export interface TopicInput extends RevisionInput { topic: KnowledgeTopic }
export interface DraftEdit extends TopicInput { expected_draft_revision: number; topic_id: string }
export interface DraftAcceptance extends RevisionInput {
  expected_draft_revision: number; topic_ids: string[]; acknowledge_warnings?: boolean;
  approved_flagged_topic_ids?: string[];
}
export interface SessionInput { mode?: 'knowledge'; channel?: KnowledgeChannel; draft_id?: string }
export interface KnowledgeWriteOptions extends RequestOptions { idempotencyKey: string }
export interface KnowledgeUploadOptions extends KnowledgeWriteOptions {
  /** Printable ASCII upload name; defaults to the local basename. File contents stream in chunks. */
  filename?: string; sourceTitle?: string; review?: boolean; expectedRevision?: number;
}
export interface KnowledgeJob extends KnowledgeObject {
  id: string; kb: string; state: 'pending' | 'running' | 'needs_review' | 'ready' | 'failed' | 'cancelled' | 'deleted';
  stage: string; progress: { percent?: number; [key: string]: unknown };
  result: KnowledgeObject | null; error: KnowledgeObject | null; paid_work_started: boolean;
}
export interface JobPollOptions {
  maxAttempts?: number; intervalMs?: number; timeoutMs?: number; signal?: AbortSignal;
}
/** Oversized manual topics may create a review draft without a background job. */
export interface KnowledgeReview extends KnowledgeObject { kb: string; state: 'needs_review'; draft_id: string }
export type KnowledgeTopicResult = KnowledgeJob | KnowledgeReview;
