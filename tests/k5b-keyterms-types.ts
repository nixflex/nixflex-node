import Nixflex, { type KnowledgeKeyterms } from '../dist/index.js';
type Same<A,B> = (<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
type Assert<T extends true> = T;
type Result = Awaited<ReturnType<Nixflex['knowledge']['keyterms']>>;
type Exact = Assert<Same<Result, KnowledgeKeyterms>>;
type Fields = Assert<Same<keyof Result, 'knowledge_keyterms'|'knowledge_keyterms_count'|'knowledge_keyterms_limit'|'manual_keyterms'|'manual_keyterms_count'|'manual_keyterms_limit'>>;
type Automatic = Assert<Same<Result['knowledge_keyterms'],string[]>>;
type Manual = Assert<Same<Result['manual_keyterms'],string[]>>;
type AutoCount = Assert<Same<Result['knowledge_keyterms_count'],number>>;
type AutoLimit = Assert<Same<Result['knowledge_keyterms_limit'],number>>;
type ManualCount = Assert<Same<Result['manual_keyterms_count'],number>>;
type ManualLimit = Assert<Same<Result['manual_keyterms_limit'],number>>;
const valid: Result = {knowledge_keyterms:[],knowledge_keyterms_count:0,knowledge_keyterms_limit:80,manual_keyterms:[],manual_keyterms_count:0,manual_keyterms_limit:20};
// @ts-expect-error B49g metadata fields are required.
const missing: Result = {knowledge_keyterms:[]};
// @ts-expect-error Counts are numbers, not decimal strings.
valid.manual_keyterms_count='0';
