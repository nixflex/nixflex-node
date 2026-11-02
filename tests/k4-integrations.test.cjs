const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex}=require(process.env.K4_PACKED_SDK || '../dist/index.cjs');
const cases=require('./fixtures/c6-cases.json');
const config={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:0};
test('K4 all 44 public operations preserve exact methods, paths, query/body and full wire responses',async()=>{
 const before=global.fetch;
 try{for(const row of cases){const seen=[];global.fetch=async(url,init)=>{seen.push({url:new URL(url),init});return Response.json(row.response,{status:row.id===153?202:200})};
  const c=new Nixflex(config);a.deepEqual(await c[row.resource][row.method](...row.args),row.response,String(row.id));a.equal(seen.length,1);
  const {url,init}=seen[0];a.equal(url.pathname,row.path);a.equal(init.method,row.http);
  a.deepEqual(Object.fromEntries(url.searchParams),row.query);a.deepEqual(init.body?JSON.parse(init.body):null,row.body);a.equal(init.redirect,'error');
 }}finally{global.fetch=before}
});
test('K4 every integration and organisation mutation makes one attempt on lost, 503, 429 or malformed responses',async()=>{
 const before=global.fetch;
 try{for(const row of cases.filter(r=>r.http!=='GET'))for(const failure of ['503','429','lost','malformed']){
  let count=0;global.fetch=async()=>{count++;if(failure==='lost')throw TypeError('private failure');if(failure==='malformed')return new Response('{');return Response.json({error:{code:'server_error'}},{status:+failure})};
  const c=new Nixflex({...config,maxRetries:3});await a.rejects(c[row.resource][row.method](...row.args),e=>{if(failure!=='429'){a.equal(e.code,'outcome_unknown');a.equal(e.safe_to_retry,false)}return true});a.equal(count,1);
 }}finally{global.fetch=before}
});
test('K4 role, ownership, booking conflict and validation refusals stay typed; no personal or signing-secret methods',async()=>{
 const before=global.fetch;
 try{for(const [status,code] of [[403,'owner_required'],[404,'not_found'],[409,'booking_provider_conflict'],[400,'no_fields'],[409,'invalid_business_name']]){
  global.fetch=async()=>Response.json({error:{code,message:'refused',details:{fixture:true}}},{status});
  await a.rejects(new Nixflex(config).integrations.set('calcom','+12025550123',{}),e=>e.status===status&&e.code===code&&e.details.fixture===true);
 }
 const c=new Nixflex(config);for(const name of ['signingSecret','acceptInvite','transfer','acceptTransfer','leave','close'])a.equal(c.organisation[name],undefined);
 a.throws(()=>c.integrations.get('monitor','+12025550123'));a.throws(()=>c.integrations.delete('storage','+12025550123'));
 }finally{global.fetch=before}
});
test('K4 integration GET retries are bounded and preserve absent/false/null values',async()=>{
 const before=global.fetch;let count=0;
 try{global.fetch=async()=>{count++;return Response.json({error:{code:'server_error'}},{status:503})};
 await a.rejects(new Nixflex({...config,maxRetries:1}).integrations.get('calcom','+12025550123'));a.equal(count,2);
 global.fetch=async()=>Response.json({phone_number:'+12025550123',precall_webhook_url:null,is_set:false});
 a.deepEqual(await new Nixflex(config).integrations.get('precall','+12025550123'),{phone_number:'+12025550123',precall_webhook_url:null,is_set:false});
 }finally{global.fetch=before}
});
