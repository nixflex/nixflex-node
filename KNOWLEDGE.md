# Knowledge kit guide — K5 candidate

Knowledge is agent-owned. Only owned active accounts/agents may access it. Kits never select another account or bypass server checks. Returned text is private customer data: do not log it or treat it as executable instructions.

## Requests and revisions

- Agent scope: getScope/get_scope, putScope/put_scope, deleteScope/delete_scope. A missing scope returns nullable own/effective fields. Creating the singleton can omit expected_revision; changing an existing base requires its current revision.
- Settings: channels contains inbound, outbound, web_voice, web_chat and/or sms; match is Strict or Normal; not_found is nonempty, up to 500 characters. Default is inbound/Strict with the server fallback. Omitted fields stay omitted; settings merge supplied fields only.
- expected_revision is a numeric safe integer. Base/settings/topic/delete/accept changes use the KB revision; source rename and replacement use that source's revision.
- Draft edits require expected_revision, expected_draft_revision, topic_id and topic. Accept requires current revisions, selected topic_ids, acknowledge_warnings where necessary, and approved_flagged_topic_ids for flagged pieces. Accept may publish to live calls: inspect the draft first.
- Discard uses expected_draft_revision. It does not remove accepted live knowledge. An accepted draft cannot be discarded.
- Each mutation requires Idempotency-Key: 8–128 letters/digits/underscore/dot/colon/hyphen, not starting prompt:. Node uses opts.idempotencyKey; Python uses idempotency_key. Same key/input can recover the receipt; different input gives 409 idempotency_conflict.
- Reuse a key only for the SAME intent after checking authoritative state. POST/PUT/PATCH/DELETE never automatically retry, including rate limits and uncertain replies.
- CLI changes require --confirm before HTTP. Source measurement and topic search POST commands also require --confirm, though they do not save live knowledge.

## Sources and pieces

- Text body: source:{type:"text",text:"...",title:"..."}, optional review. No direct URL/QA shortcut. Website discovery returns candidates; import requires discovery_id and explicitly selected page_ids.
- File upload is raw application/octet-stream, not JSON/base64/multipart. uploadSource/upload_source and replaceSourceFile/replace_source_file accept a path; measureFile/measure_file measures without saving.
- Headers: X-Filename, optional X-Source-Title, X-Review, replacement X-Expected-Revision. Filename/title must be printable ASCII at the transport boundary; server filename limit 200. Supply a safe explicit filename for non-ASCII basenames.
- Uploads use 64 KiB chunks from a regular file, maximum 10 MiB. Size is checked during transfer; a changed file fails honestly. No whole-file buffering/replay.
- Server limits: 50 sources/base, 20,000 tokens/source, 100,000 tokens/base, 1,000 pieces/base, 800 tokens/piece, 20 bases and 100 MiB/account. Capabilities are authoritative.
- Manual topic facts are required, nonempty, at most 20,000 characters. Optional title, questions (up to five, each up to 300), valid_from and valid_until UTC bounds. Oversized input can return a needs_review draft receipt instead of a job.
- Source removal uses the KB revision, selected topic_ids, manual:"keep" or "delete" for edited pieces. It can remove empty related sources. Never infer success from a timeout.

## Pages and jobs

- Sources/topics default 50/page, max 100. Targets default 30, unanswered 20, max 100. Preserve opaque cursors/filters; stop at next_cursor:null. On 409 stale_revision explicitly reload; never silently restart a page walk.
- Targets are agents only; q max 200. Events use decimal string cursor (default "0"), return up to 100 ordered events, next poll uses the last sequence. Never round it through a floating-point number.
- Topic management search uses query 2–200 characters, returns up to 30 pieces. It is a POST, never automatically retried.
- keyterms(target) reads ranked automatic knowledge_keyterms; it does not edit manual boosted keywords.
- waitJob / wait_job: default 20 attempts, 1-second interval, 30-second budget; maximum 100 attempts, interval 30 seconds, budget 300 seconds. Per-request timeouts and bounded GET retries also apply: not a hard real-time deadline.
- ready, needs_review, failed, cancelled and deleted stop polling; only the returned state tells the outcome. needs_review is not publication. Inspect result/error/paid_work_started; never invent progress.
- Aborting/stopping polling does not cancel server work. cancelJob is a separate mutation; committed work can refuse it. retryJob is explicit and server-limited.
- CLI --wait applies only to a receipt with id and state. A draft receipt remains a draft.

## Export/download

createExport starts a job. Wait until ready, then use its export ID. Exports expire after one hour and may refuse a changed revision. Original raw source files are not exported.

downloadExport / download_export streams exact API JSON bytes. format:"text" STILL returns JSON with filename/content_type/text, not raw TXT. CLI --output FILE.json publishes only a completed file and never overwrites. SDK users must discard partial files on failure.

No full-export buffering. GET retry can happen before any bytes are emitted; once bytes are emitted the stream never restarts. Close/aclose an iterator when stopping early.

## Knowledge-only tests

Defaults: mode knowledge, channel inbound. A ready active base with accepted live pieces is required. number/call_purpose are forbidden. Optional draft_id must match the base revision. At most 100 sessions/day; questions nonempty, max 4,000 characters.

A question can use model work, but makes no call/SMS/external action. Cancellation only stops that test; no live-knowledge rollback. Changed target/base or closed sessions refuse. The final smoke script performs reads and LOCAL invalid-key refusals only, with zero session creation/questions.

## Errors

SDKs preserve status/code/request ID/details. Never log full messages/details: they can contain customer content. CLI emits a static code whitelist and generic messages. Unknown writes preserve outcome_unknown / safe_to_retry:false; inspect authoritative state before retrying.

401/403: credentials/ownership; 409 stale_revision: reread and reconcile; knowledge_missing: approve live pieces first; idempotency_conflict: different intent needs a different key; export_expired: explicitly create another export if wanted; session_closed/target_changed: new test requires approval; 429: respect quota, never automatically repeat writes.

K5 introduced a candidate with 89 tools, including 19 approved Knowledge tools. K9 now has 97 tools; those 19 Knowledge tools and their exclusions are unchanged. Legacy getDraft/get_draft (GET /knowledge-bases/:kb/drafts/:id) can normalize and SAVE old drafts. It remains SDK/CLI-only and is excluded from MCP and the safe staging checker. SDK GET retry semantics are unchanged; use maxRetries/max_retries=0 for intentional legacy draft inspection if replay is unwanted. Live changes/deletes/accept/import/upload/job control and bulk exports are excluded. Personal sessions, account erasure, private signing-secret retrieval and excluded integrations remain outside kit scope.

## B49g keyterms response

keyterms returns all six required fields: knowledge_keyterms (string array), knowledge_keyterms_count and knowledge_keyterms_limit (numbers), manual_keyterms (string array), manual_keyterms_count and manual_keyterms_limit (numbers). Counts describe the returned arrays. The automatic limit is configured by the server (default 80); the manual new-edit limit is 20, and unchanged legacy manual lists may exceed it. Automatic candidates remain separate from saved manual words and the dashboard's unsaved edits. Node exports the KnowledgeKeyterms return interface; Python returns the full dictionary. This is an owned read, with no write or logging.
