import Nixflex, { type KnowledgeTopicResult } from '../dist/index.js';
// @ts-expect-error Private removed integration types are not public exports.
import type { LlmProvider } from '../dist/index.js';
const c = new Nixflex({apiKey:'fixture:fixture'});
async function check() {
 const result: KnowledgeTopicResult = await c.knowledge.createTopic('kb', {expected_revision:1,topic:{facts:'Example'}},{idempotencyKey:'example-op'});
 if ('draft_id' in result) { const draft: unknown = result.draft_id; }
 // @ts-expect-error Revisions are safe numeric integers, not opaque cursor strings.
 await c.knowledge.updateSettings('kb',{expected_revision:'1',settings:{}},{idempotencyKey:'example-op'});
 // @ts-expect-error An explicit idempotency key is required for a mutation.
 await c.knowledge.deleteScope('agent',{expected_revision:1});
 const cursor: string | null = (await c.knowledge.listTopics('kb',{limit:1,cursor:'opaque'})).next_cursor;
 for await(const chunk of c.knowledge.downloadExport('export',{format:'text'})) { const bytes: Uint8Array = chunk; }
 const terms: string[] = (await c.knowledge.keyterms('agent')).knowledge_keyterms;
}
void check;
