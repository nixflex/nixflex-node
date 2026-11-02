const {test}=require('node:test'),a=require('node:assert/strict');
const {default:Nixflex}=require(process.env.K5_PACKED_SDK||'../dist/index.cjs');
const cases=require('./fixtures/k5-cases.json');
const client=()=>new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:1});
const args=row=>[...row.args,...(row.type?[row.body]:[]),...(row.query_type?[row.query]:[]),
  ...(row.mutating?[{idempotencyKey:'fixture-k5-operation'}]:[])];
test('K5 all 39 Knowledge operations plus keyterms use exact wire fields, paths, queries and explicit operation keys',async()=>{
 const saved=global.fetch;
 try{for(const row of cases){
  let calls=0;
  global.fetch=async(url,init)=>{
   calls++;const u=new URL(url);a.equal(u.origin,'https://fixture.invalid');a.equal(u.pathname,row.wire_path);
   a.equal(init.method,row.method);a.equal(init.redirect,'error');
   a.deepEqual(Object.fromEntries(u.searchParams),Object.fromEntries(Object.entries(row.query).map(([k,v])=>[k,String(v)])));
   a.deepEqual(init.body?JSON.parse(init.body):null,row.body);
   a.equal(init.headers['Idempotency-Key'],row.mutating?'fixture-k5-operation':undefined);
   return Response.json(row.response);
  };
  const result=client().knowledge[row.name](...args(row));
  if(row.number===128){const chunks=[];for await(const c of result)chunks.push(Buffer.from(c));a.deepEqual(JSON.parse(Buffer.concat(chunks)),row.response)}
  else a.deepEqual(await result,row.response);
  a.equal(calls,1,row.name);
 }}finally{global.fetch=saved}
});
test('K5 every mutation rejects missing/reserved keys before HTTP; writes and POST reads never auto-repeat uncertain requests',async()=>{
 const saved=global.fetch;let calls=0;
 try{global.fetch=async()=>{calls++;throw Error('private-customer-content')};
  for(const row of cases.filter(r=>r.mutating)){
   for(const opts of [{},{idempotencyKey:'prompt:reserved'}, {idempotencyKey:'short'}]){
    const before=calls;a.throws(()=>client().knowledge[row.name](...args(row).slice(0,-1),opts),/Idempotency/);a.equal(calls,before);
   }
   const before=calls;await a.rejects(client().knowledge[row.name](...args(row)),e=>e.code==='outcome_unknown'&&e.safe_to_retry===false);a.equal(calls,before+1);
  }
  for(const name of ['measureSource','searchTopics']){const row=cases.find(r=>r.name===name),before=calls;
   await a.rejects(client().knowledge[name](...args(row)),e=>e.code==='outcome_unknown');a.equal(calls,before+1)}
 }finally{global.fetch=saved}
});
test('K5 bounded GET retry, exact stale revision errors and needs-review/failed/deleted polling stay truthful',async()=>{
 const saved=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;return calls===1?Response.json({error:{code:'unavailable'}},{status:503}):Response.json({items:[],next_cursor:null})};
  a.deepEqual(await client().knowledge.listTopics('kb'),{items:[],next_cursor:null});a.equal(calls,2);
  global.fetch=async()=>Response.json({error:{code:'stale_revision',message:'Reload',details:{expected_revision:5}}},{status:409});
  await a.rejects(client().knowledge.updateTopic('kb','topic',{expected_revision:1,topic:{facts:'example'}},{idempotencyKey:'fixture-k5-operation'}),
   e=>e.status===409&&e.code==='stale_revision'&&e.details.expected_revision===5);
  for(const state of ['ready','failed','deleted','cancelled','needs_review']){
   calls=0;global.fetch=async()=>{calls++;return Response.json({id:'job',state})};
   a.equal((await client().knowledge.waitJob('job',{intervalMs:0})).state,state);a.equal(calls,1);
  }
  calls=0;global.fetch=async()=>{calls++;return Response.json({id:'job',state:'pending'})};
  await a.rejects(client().knowledge.waitJob('job',{intervalMs:0,maxAttempts:2}),/polling limit/);a.equal(calls,2);
  await a.rejects(client().knowledge.waitJob('job',{maxAttempts:Infinity}),/attempts/);
  const controller=new AbortController();controller.abort();await a.rejects(client().knowledge.waitJob('job',{signal:controller.signal}),/cancelled/);a.equal(calls,2);
 }finally{global.fetch=saved}
});
