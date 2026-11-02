const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex}=require('../dist/index.cjs');
const config={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:0};
const voice={voice_key:'voice/a',displayName:'Example',gender:'unknown',nativeLanguage:null,locale:null,
 accents:[],languages:[],origin:'standard',availability:'unavailable',selectable:false,
 incompatibilityReason:'voice_unavailable',previewLanguage:null,previewStatus:'none',previewUrl:null};
test('K2 core reads preserve paths, all query fields, opaque cursors and nullable results',async()=>{
 const before=global.fetch,seen=[];global.fetch=async(u,o)=>{seen.push({url:new URL(u),init:o});return Response.json({data:[voice],next_cursor:'opaque+/='})};
 try{const c=new Nixflex(config);
  await c.account.retention();await c.keys.activity();await c.keys.activity({period:'7d'});
  await c.voices.list();const query={language:'en',gender:'unknown',locale:'en-GB',agent_id:'a',agent_language:'multi',availability:'all',limit:1,cursor:'opaque+/='};
  a.deepEqual(await c.voices.list(query),{data:[voice],next_cursor:'opaque+/='});
  await c.voices.get('voice/a',{agent_id:'a',agent_language:'multi'});
  a.deepEqual(seen.map(x=>x.url.pathname),['/v1/account/retention','/v1/keys/activity','/v1/keys/activity','/v1/voices','/v1/voices','/v1/voices/voice%2Fa']);
  a.equal(seen[1].url.search,'');a.equal(seen[2].url.search,'?period=7d');a.equal(seen[3].url.search,'');
  a.deepEqual(Object.fromEntries(seen[4].url.searchParams),{...query,limit:'1'});
  a.deepEqual(Object.fromEntries(seen[5].url.searchParams),{agent_id:'a',agent_language:'multi'});
  a.ok(seen.every(x=>x.init.method==='GET'&&!x.init.body));
  a.equal(c.account.delete,undefined);a.equal(c.account.close,undefined);
 }finally{global.fetch=before}
});
test('K2 reads retry only transient failures and preserve cursor errors without restarting pages',async()=>{
 const before=global.fetch;let count=0;global.fetch=async()=>{count++;return Response.json({error:{code:'catalog_unavailable',message:'Later'}},{status:503})};
 try{const c=new Nixflex({...config,maxRetries:1});await a.rejects(c.voices.list(),e=>e.code==='catalog_unavailable');a.equal(count,2);
  count=0;global.fetch=async()=>{count++;return Response.json({error:{type:'invalid_request_error',code:'cursor_expired',message:'Restart',details:{revision:'new'}}},{status:409,headers:{'x-request-id':'core-fixture'}})};
  await a.rejects(c.voices.list({cursor:'expired'}),e=>{a.deepEqual(e.toJSON().error,{type:'invalid_request_error',code:'cursor_expired',message:'Restart',details:{revision:'new'},status:409,request_id:'core-fixture',doc_url:null});return true});a.equal(count,1);
 }finally{global.fetch=before}
});
test('K2 signup is unauthenticated and never repeats uncertain, refused or malformed writes',async()=>{
 const before=global.fetch,seen=[];
 try{for(const response of [()=>Response.json({key_id:'fixture',key_secret:'fixture'},{status:201}),
   ()=>Response.json({error:{code:'server_error'}},{status:500}),()=>Response.json({error:{code:'key_creation_rate_limited'}},{status:429}),
   ()=>new Response('{',{status:201}),()=>{throw new TypeError('private failure')}]){
   global.fetch=async(u,o)=>{seen.push(o);return response()};const start=seen.length;
   try{await Nixflex.createKey({name:null,email:null},config.baseUrl)}catch(e){a.ok(['outcome_unknown','key_creation_rate_limited'].includes(e.code));a.ok(!e.message.includes('private failure'))}
   a.equal(seen.length,start+1);a.equal(seen.at(-1).headers.Authorization,undefined);a.equal(seen.at(-1).redirect,'error');
   a.deepEqual(JSON.parse(seen.at(-1).body),{name:null,email:null});
  }
 }finally{global.fetch=before}
});
