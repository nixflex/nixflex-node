const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex}=require(process.env.K3_PACKED_SDK || '../dist/index.cjs');
const cases=require('./fixtures/c5-cases.json');
const config={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:0};
const resource=(c,path)=>path.split('.').reduce((v,k)=>v[k],c);
test('K3 all 27 operations preserve exact method, encoded path, JSON, paging, false/zero/null and response',async()=>{
 const before=global.fetch;
 try {for(const row of cases){let seen=[];global.fetch=async(url,init)=>{seen.push({url:new URL(url),init});return Response.json(row.response)};
  const c=new Nixflex(config),r=resource(c,row.resource);a.deepEqual(await r[row.method](...row.args),row.response,String(row.id));
  a.equal(seen.length,1);const {url,init}=seen[0];a.equal(url.pathname,row.path);a.equal(init.method,row.http);
  a.deepEqual(Object.fromEntries(url.searchParams),Object.fromEntries(Object.entries(row.query).map(([k,v])=>[k,String(v)])));
  a.deepEqual(init.body?JSON.parse(init.body):null,row.body);a.equal(init.redirect,'error');
 }}finally{global.fetch=before}
});
test('K3 every POST/PATCH/DELETE including preview is one attempt on refusal, uncertainty and malformed success',async()=>{
 const before=global.fetch;
 try{for(const row of cases.filter(r=>r.http!=='GET'))for(const failure of ['503','429','lost','malformed']){
  let count=0;global.fetch=async()=>{count++;if(failure==='lost')throw TypeError('private transport detail');if(failure==='malformed')return new Response('{');return Response.json({error:{code:'refused',details:{safe_to_retry:false}}},{status:Number(failure)})};
  const r=resource(new Nixflex({...config,maxRetries:2}),row.resource);
  await a.rejects(r[row.method](...row.args),e=>{a.ok(e.code);if(failure!=='429')a.equal(e.code,'outcome_unknown');return true});
  a.equal(count,1,row.id+' '+failure);
 }}finally{global.fetch=before}
});
test('K3 GET retries are bounded and cursor/revision refusals are preserved without restart',async()=>{
 const before=global.fetch;let n=0;
 try{global.fetch=async()=>{n++;return Response.json({error:{code:'unavailable'}},{status:503})};
  await a.rejects(new Nixflex({...config,maxRetries:1}).contacts.list({after:'+12025550123'}));a.equal(n,2);
  n=0;global.fetch=async()=>{n++;return Response.json({error:{code:'widget_settings_changed',details:{revision:'999999999999999999'}}},{status:409})};
  await a.rejects(new Nixflex(config).webAgent.update('+12025550123',{revision:'1',settings:{web_name:''}}),e=>e.code==='widget_settings_changed'&&e.details.revision==='999999999999999999');a.equal(n,1);
 }finally{global.fetch=before}
});
