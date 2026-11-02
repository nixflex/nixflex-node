import type { HttpClient, RequestOptions } from '../client.js';
import type { KnowledgeObject, KnowledgePage, KnowledgeJob, KnowledgeTopicResult, JobPollOptions, KnowledgeUploadOptions, KnowledgeWriteOptions, PageQuery, TargetQuery, RevisionInput, ScopeInput, SessionInput, DraftEdit, DraftAcceptance, EmptyInput, SettingsInput, SourceInput, SourceReplacement, SourceDeletion, TopicInput, WebsiteInput } from '../types/knowledge.js';
import { identifier as enc, writeOptions } from '../knowledge/guards.js';
import { pollJob } from '../knowledge/poll.js';
/** Agent-owned knowledge. No automatic logging. Explicit idempotency keys for changes. */
export class Knowledge {
  constructor(private readonly http: HttpClient) {}
  /** DELETE /agents/:target/knowledge-base. Never auto-repeated; use a stable explicit operation key. */
  deleteScope(target: string, body: RevisionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('DELETE', `/agents/${enc(target)}/knowledge-base`, body, undefined, writeOptions(opts));
  }
  /** GET /agents/:target/knowledge-base. Read result is private customer data. */
  getScope(target: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/agents/${enc(target)}/knowledge-base`, undefined, undefined, opts);
  }
  /** PUT /agents/:target/knowledge-base. Never auto-repeated; use a stable explicit operation key. */
  putScope(target: string, body: ScopeInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('PUT', `/agents/${enc(target)}/knowledge-base`, body, undefined, writeOptions(opts));
  }
  /** POST /agents/:target/knowledge-base/source-measure. Read result is private customer data. */
  measureSource(target: string, body: { text: string }, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/agents/${enc(target)}/knowledge-base/source-measure`, body, undefined, opts);
  }
  /** POST /agents/:target/knowledge-base/test-sessions. Never auto-repeated; use a stable explicit operation key. */
  startSession(target: string, body: SessionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/agents/${enc(target)}/knowledge-base/test-sessions`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb. Read result is private customer data. */
  getBase(kb: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}`, undefined, undefined, opts);
  }
  /** DELETE /knowledge-bases/:kb/drafts/:id. Never auto-repeated; use a stable explicit operation key. */
  discardDraft(kb: string, id: string, body: { expected_draft_revision: number }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('DELETE', `/knowledge-bases/${enc(kb)}/drafts/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb/drafts/:id. Read result is private customer data. */
  getDraft(kb: string, id: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/drafts/${enc(id)}`, undefined, undefined, opts);
  }
  /** PATCH /knowledge-bases/:kb/drafts/:id. Never auto-repeated; use a stable explicit operation key. */
  updateDraft(kb: string, id: string, body: DraftEdit, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('PATCH', `/knowledge-bases/${enc(kb)}/drafts/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/drafts/:id/accept. Never auto-repeated; use a stable explicit operation key. */
  acceptDraft(kb: string, id: string, body: DraftAcceptance, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/drafts/${enc(id)}/accept`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/exports. Never auto-repeated; use a stable explicit operation key. */
  createExport(kb: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/exports`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb/overview. Read result is private customer data. */
  overview(kb: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/overview`, undefined, undefined, opts);
  }
  /** PATCH /knowledge-bases/:kb/settings. Never auto-repeated; use a stable explicit operation key. */
  updateSettings(kb: string, body: SettingsInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('PATCH', `/knowledge-bases/${enc(kb)}/settings`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb/sources. Read result is private customer data. */
  listSources(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/sources`, undefined, { ...query }, opts);
  }
  /** POST /knowledge-bases/:kb/sources. Never auto-repeated; use a stable explicit operation key. */
  addSource(kb: string, body: SourceInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/sources`, body, undefined, writeOptions(opts));
  }
  /** DELETE /knowledge-bases/:kb/sources/:id. Never auto-repeated; use a stable explicit operation key. */
  deleteSource(kb: string, id: string, body: SourceDeletion, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('DELETE', `/knowledge-bases/${enc(kb)}/sources/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** PATCH /knowledge-bases/:kb/sources/:id. Never auto-repeated; use a stable explicit operation key. */
  renameSource(kb: string, id: string, body: { expected_revision: number; title: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('PATCH', `/knowledge-bases/${enc(kb)}/sources/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/sources/:id/replacements. Never auto-repeated; use a stable explicit operation key. */
  replaceSource(kb: string, id: string, body: SourceReplacement, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/sources/${enc(id)}/replacements`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/sources/refresh. Never auto-repeated; use a stable explicit operation key. */
  refreshSources(kb: string, body: { source_ids: string[]; review?: boolean }, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/sources/refresh`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/topic-search. Read result is private customer data. */
  searchTopics(kb: string, body: { query: string }, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/topic-search`, body, undefined, opts);
  }
  /** GET /knowledge-bases/:kb/topics. Read result is private customer data. */
  listTopics(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/topics`, undefined, { ...query }, opts);
  }
  /** POST /knowledge-bases/:kb/topics. Never auto-repeated; use a stable explicit operation key. */
  createTopic(kb: string, body: TopicInput, opts: KnowledgeWriteOptions): Promise<KnowledgeTopicResult> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/topics`, body, undefined, writeOptions(opts));
  }
  /** DELETE /knowledge-bases/:kb/topics/:id. Never auto-repeated; use a stable explicit operation key. */
  deleteTopic(kb: string, id: string, body: RevisionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('DELETE', `/knowledge-bases/${enc(kb)}/topics/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb/topics/:id. Read result is private customer data. */
  getTopic(kb: string, id: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/topics/${enc(id)}`, undefined, undefined, opts);
  }
  /** PATCH /knowledge-bases/:kb/topics/:id. Never auto-repeated; use a stable explicit operation key. */
  updateTopic(kb: string, id: string, body: TopicInput, opts: KnowledgeWriteOptions): Promise<KnowledgeTopicResult> {
    return this.http.request('PATCH', `/knowledge-bases/${enc(kb)}/topics/${enc(id)}`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge-bases/:kb/unanswered. Read result is private customer data. */
  unanswered(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> {
    return this.http.request('GET', `/knowledge-bases/${enc(kb)}/unanswered`, undefined, { ...query }, opts);
  }
  /** POST /knowledge-bases/:kb/website-discoveries. Never auto-repeated; use a stable explicit operation key. */
  discoverWebsite(kb: string, body: { url: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/website-discoveries`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge-bases/:kb/website-imports. Never auto-repeated; use a stable explicit operation key. */
  importWebsite(kb: string, body: WebsiteInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge-bases/${enc(kb)}/website-imports`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge/capabilities. Read result is private customer data. */
  capabilities(opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge/capabilities`, undefined, undefined, opts);
  }
  /** GET /knowledge/events. Read result is private customer data. */
  events(query: { cursor?: string } = {}, opts?: RequestOptions): Promise<KnowledgeObject[]> {
    return this.http.request('GET', `/knowledge/events`, undefined, { ...query }, opts);
  }
  /** GET /knowledge/exports/:id. Read result is private customer data. */
  downloadExport(id: string, query: { format?: 'json' | 'text' } = {}, opts?: RequestOptions): AsyncGenerator<Uint8Array> {
    return this.http.knowledgeDownload(`/knowledge/exports/${enc(id)}`, { ...query }, opts);
  }
  /** GET /knowledge/jobs/:id. Read result is private customer data. */
  getJob(id: string, opts?: RequestOptions): Promise<KnowledgeJob> {
    return this.http.request('GET', `/knowledge/jobs/${enc(id)}`, undefined, undefined, opts);
  }
  /** POST /knowledge/jobs/:id/cancel. Never auto-repeated; use a stable explicit operation key. */
  cancelJob(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge/jobs/${enc(id)}/cancel`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge/jobs/:id/retry. Never auto-repeated; use a stable explicit operation key. */
  retryJob(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> {
    return this.http.request('POST', `/knowledge/jobs/${enc(id)}/retry`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge/targets. Read result is private customer data. */
  targets(query: TargetQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> {
    return this.http.request('GET', `/knowledge/targets`, undefined, { ...query }, opts);
  }
  /** GET /knowledge/test-sessions/:id. Read result is private customer data. */
  getSession(id: string, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge/test-sessions/${enc(id)}`, undefined, undefined, opts);
  }
  /** POST /knowledge/test-sessions/:id/cancel. Never auto-repeated; use a stable explicit operation key. */
  cancelSession(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/knowledge/test-sessions/${enc(id)}/cancel`, body, undefined, writeOptions(opts));
  }
  /** POST /knowledge/test-sessions/:id/messages. Never auto-repeated; use a stable explicit operation key. */
  ask(id: string, body: { text: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> {
    return this.http.request('POST', `/knowledge/test-sessions/${enc(id)}/messages`, body, undefined, writeOptions(opts));
  }
  /** GET /knowledge/usage. Read result is private customer data. */
  usage(query: { kb?: string } = {}, opts?: RequestOptions): Promise<KnowledgeObject> {
    return this.http.request('GET', `/knowledge/usage`, undefined, { ...query }, opts);
  }
  /** GET /agents/:target/knowledge-keyterms. Read result is private customer data. */
  keyterms(target: string, opts?: RequestOptions): Promise<{ knowledge_keyterms: string[] }> {
    return this.http.request('GET', `/agents/${enc(target)}/knowledge-keyterms`, undefined, undefined, opts);
  }
  uploadSource(kb: string, file: string, opts: KnowledgeUploadOptions): Promise<KnowledgeJob> {
    return this.http.knowledgeUpload("/knowledge-bases/" + enc(kb) + "/sources", file, writeOptions(opts));
  }
  replaceSourceFile(kb: string, id: string, file: string, opts: KnowledgeUploadOptions): Promise<KnowledgeJob> {
    return this.http.knowledgeUpload("/knowledge-bases/" + enc(kb) + "/sources/" + enc(id) + "/replacements", file, writeOptions(opts));
  }
  measureFile(target: string, file: string, opts: RequestOptions = {}): Promise<KnowledgeObject> {
    return this.http.knowledgeUpload("/agents/" + enc(target) + "/knowledge-base/source-measure", file, opts);
  }
  waitJob(id: string, options: JobPollOptions = {}): Promise<KnowledgeJob> {
    return pollJob(timeoutMs => this.getJob(id, { timeoutMs, signal: options.signal }), options);
  }
}
