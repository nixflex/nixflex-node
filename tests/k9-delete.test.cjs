const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex,NixflexServerError,NixflexOutcomeUnknownError}=require(process.env.K9_PACKED_SDK||'../dist/index.cjs');
const config={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:3};
const id='fixture /+id';
const call={call_id:id,deleted:true,recording_deleted:false,recording_cleanup:'queued'};
const campaign={campaign_id:id,deleted:true,message:'Campaign deleted'};
const all={deleted:true,calls_deleted:2,recordings_deleted:1,sms_deleted:0};
const cases=[
 {name:'call',path:'/calls/'+encodeURIComponent(id),run:c=>c.calls.delete(id),body:call},
 {name:'voice',path:'/calls/batch/'+encodeURIComponent(id),run:c=>c.campaigns.delete(id),body:campaign},
 {name:'sms',path:'/sms/campaigns/'+encodeURIComponent(id),run:c=>c.sms.campaigns.delete(id),body:campaign},
 {name:'bulk',path:'/calls',run:c=>c.calls.deleteAll(),body:all},
];
const queued={error:{type:'server_error',code:'hangup_pending',message:'Deletion is queued.',
 doc_url:'https://example.invalid/errors/hangup_pending',details:{deleted:false,retry_pending:true}}};

for(const row of cases)test('K9 '+row.name+' deletion preserves receipts/errors and never repeats',async()=>{
 const original=global.fetch;
 try{for(const mode of ['success','already-gone','403','404','queued','503','lost','malformed']){
  let count=0;global.fetch=async(url,init)=>{
   count++;a.equal(new URL(url).pathname,'/v1'+row.path);a.equal(init.method,'DELETE');a.equal(init.redirect,'error');a.equal(init.body,undefined);
   if(mode==='success')return Response.json(row.body);
   if(mode==='lost')throw Error('private transport detail');
   if(mode==='malformed')return new Response('{',{status:200});
   const status=mode==='queued'||mode==='503'?503:mode==='403'?403:404;
   const body=mode==='queued'?queued:{error:{type:status===503?'server_error':'refused',code:status===404?'not_found':status===403?'permission_denied':'deletion_unavailable',message:'Not confirmed.',details:{deleted:false,evidence:'fixture'}}};
   return Response.json(body,{status,headers:{'x-request-id':'request-fixture'}});
  };
  if(mode==='success')a.deepEqual(await row.run(new Nixflex(config)),row.body);
  else await a.rejects(row.run(new Nixflex(config)),error=>{
   if(mode==='queued'&&row.name!=='bulk'){
    a.ok(error instanceof NixflexServerError);a.ok(!(error instanceof NixflexOutcomeUnknownError));
    a.equal(error.status,503);a.equal(error.code,'hangup_pending');a.deepEqual(error.details,queued.error.details);a.equal(error.message,queued.error.message);a.equal(error.doc_url,queued.error.doc_url);
   }else if(['queued','503','lost','malformed'].includes(mode)){
    a.ok(error instanceof NixflexOutcomeUnknownError);a.equal(error.safe_to_retry,false);
    if(mode==='503'||mode==='queued'){a.equal(error.status,503);a.equal(error.details.original_code,mode==='queued'?'hangup_pending':'deletion_unavailable');a.equal(error.details.deleted,false)}
   }else{a.equal(error.status,mode==='403'?403:404);a.equal(error.code,mode==='403'?'permission_denied':'not_found');a.equal(error.details.evidence,'fixture')}
   if(!['lost','malformed'].includes(mode))a.equal(error.request_id,'request-fixture');
   a.ok(!error.message.includes('private transport'));return true;
  });
  a.equal(count,1,mode);
 }}finally{global.fetch=original}
});

test('K9 only complete B57 queue proof on exact DELETE routes changes classification',async()=>{
 const original=global.fetch;
 try{for(const body of [queued,{error:{...queued.error,details:{deleted:false}}},
  {error:{...queued.error,details:{deleted:'false',retry_pending:true}}},
  {error:{...queued.error,details:{deleted:false,retry_pending:'true'}}},
  {error:{...queued.error,code:'deletion_unavailable'}},{error:{...queued.error,type:'other'}}]){
  global.fetch=async()=>Response.json(body,{status:503});
  await a.rejects(new Nixflex(config).campaigns.delete(id),e=>body===queued?e.code==='hangup_pending':e.code==='outcome_unknown');
  for(const op of [c=>c.campaigns.cancel(id),c=>c.agents.delete(id),c=>c.calls.deleteAll()])
   await a.rejects(op(new Nixflex(config)),e=>e.code==='outcome_unknown');
 }}finally{global.fetch=original}
});

test('K9 fresh list and detail reads after removal preserve absence and never invent data',async()=>{
 const original=global.fetch,seen=[];let removed=false;
 global.fetch=async(url,init)=>{const path=new URL(url).pathname;seen.push(init.method+' '+path);
  if(init.method==='DELETE'){removed=true;return Response.json(campaign)}
  if(path==='/v1/campaigns')return Response.json({campaigns:removed?[]:[{campaign_id:id}],total:removed?0:1});
  if(path==='/v1/sms/campaigns')return Response.json({campaigns:[],next_cursor:null});
  if(path==='/v1/calls')return Response.json([]);
  return Response.json({error:{code:'not_found',message:'Missing',details:{}}},{status:404});
 };
 try{const c=new Nixflex(config);a.equal((await c.campaigns.list()).campaigns.length,1);await c.campaigns.delete(id);
  a.equal((await c.campaigns.list()).campaigns.length,0);a.deepEqual(await c.calls.list(),[]);a.deepEqual(await c.sms.campaigns.list(),{campaigns:[],next_cursor:null});
  for(const op of [()=>c.calls.get(id),()=>c.calls.read(id),()=>c.calls.recording(id),()=>c.sms.campaigns.get(id)])await a.rejects(op(),e=>e.status===404);
  a.equal(seen.filter(x=>x.startsWith('DELETE ')).length,1);
 }finally{global.fetch=original}
});

test('K9 content-delete IDs cannot normalize to a bulk or different endpoint',()=>{
 const original=global.fetch;let count=0;global.fetch=async()=>{count++;throw Error('Must not send')};
 try{const c=new Nixflex(config);for(const id of ['', '.', '..', 'line\nbreak', 'x'.repeat(201)])
  for(const op of [()=>c.calls.delete(id),()=>c.campaigns.delete(id),()=>c.sms.campaigns.delete(id)])a.throws(op,/Nothing was sent/);
  a.equal(count,0);
 }finally{global.fetch=original}
});
