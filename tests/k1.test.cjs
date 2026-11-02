const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex,HttpClient,NixflexError}=require('../dist/index.cjs');
const fs=require('node:fs'),http=require('node:http'),{spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os');
const version=require('../package.json').version;
const options={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:0};
const wire=require('./fixtures/k1-wire.json');
test('K1 wire fields preserve explicit policy, location and canonical SMS template/date',async()=>{
 const original=global.fetch,seen=[];global.fetch=async(url,init)=>{seen.push({url:new URL(url),init});return Response.json({ok:true})};
 try{const c=new Nixflex(options);
  await c.sms.campaigns.create(wire.campaign);a.deepEqual(JSON.parse(seen[0].init.body),wire.campaign);
  await c.calls.create(wire.call);a.deepEqual(JSON.parse(seen[1].init.body),wire.call);
  await c.sms.send(wire.sms);a.deepEqual(JSON.parse(seen[2].init.body),wire.sms);
  await c.agents.create({});a.deepEqual(JSON.parse(seen[3].init.body),{});
  await c.sms.campaigns.list({limit:1000,before:'opaque'});a.equal(seen[4].url.search,'?limit=1000&before=opaque');
  await c.sms.campaigns.get('id/a',{limit:1,recipient_cursor:'r',message_cursor:'m'});a.equal(seen[5].url.search,'?limit=1&recipient_cursor=r&message_cursor=m');
  a.equal(seen[5].url.pathname,'/v1/sms/campaigns/id%2Fa');
  a.ok(seen.every(x=>x.init.headers['User-Agent']==='nixflex-node/'+version));
  a.throws(()=>c.calls.list({agent_id:'a'}),/history/);
 }finally{global.fetch=original}
});
test('K1 common error shape keeps refusal details and request id',async()=>{
 a.equal(new NixflexError(409,{error:{details:{request_id:'body-request'}}}).toJSON().error.request_id,'body-request');
 const original=global.fetch;global.fetch=async()=>Response.json(wire.error,{status:409,headers:{'x-request-id':'request-fixture'}});
 try{await a.rejects(new Nixflex(options).sms.send(wire.sms),e=>{
  a.ok(e instanceof NixflexError);a.deepEqual(e.toJSON(),{error:{...wire.error.error,status:409,request_id:'request-fixture'}});return true;
 })}finally{global.fetch=original}
});
test('K1 raw transport keeps bytes/idempotency/revision; no auth override or mutation retry',async()=>{
 const original=global.fetch,seen=[];global.fetch=async(url,init)=>{seen.push(init);return Response.json(wire.error,{status:409})};
 try{const c=new HttpClient(options),bytes=new Uint8Array([0,128,255,10]);
  const opts={rawBody:bytes,idempotencyKey:'fixture-operation',filename:'source.txt',sourceTitle:'Facts',review:false,expectedRevision:0};
  for(let i=0;i<2;i++)await a.rejects(c.request('POST','/knowledge-bases/base/sources',undefined,undefined,opts),e=>e.status===409);
  a.equal(seen.length,2);for(const request of seen){a.deepEqual(request.body,bytes);a.equal(request.headers['Idempotency-Key'],'fixture-operation');a.equal(request.headers['X-Expected-Revision'],'0');a.equal(request.headers['X-Review'],'false');a.equal(request.headers.Authorization,'Bearer fixture:fixture')}
  await a.rejects(c.request('POST','/knowledge-bases/base/sources',{},undefined,opts),/not both/);a.equal(seen.length,2);
  await a.rejects(c.request('GET','//evil.invalid/path'),/relative/);a.equal(seen.length,2);
 }finally{global.fetch=original}
});
test('K1 excluded operations have no public resource methods',()=>{
 const c=new Nixflex(options);
 for(const k of ['storage','llm','tts'])a.equal(c[k],undefined);
 for(const k of ['getMonitor','setMonitor'])a.equal(c.phoneNumbers[k],undefined);
 a.equal(c.calls.billing,undefined);a.equal(typeof c.account.retention,'function');a.equal(c.account.delete,undefined);a.equal(c.account.close,undefined);a.equal(c.knowledge,undefined);
});
test('K1 built CLI sends canonical CSV and shows complete errors without leaking the key',async()=>{
 const seen=[],dir=fs.mkdtempSync(path.join(os.tmpdir(),'k1-cli-'));
 const csv=path.join(dir,'recipients.csv');fs.writeFileSync(csv,'phone,country,timezone,name\n+12025550100,US,America/New_York,Sam\n');
 const server=http.createServer((req,res)=>{let body='';req.on('data',x=>body+=x);req.on('end',()=>{seen.push({url:req.url,body:body?JSON.parse(body):null});res.writeHead(req.url.includes('invalid')?409:200,{'Content-Type':'application/json','x-request-id':'request-fixture'});res.end(JSON.stringify(req.url.includes('invalid')?wire.error:{ok:true}));})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=args=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.resolve(__dirname,'../dist/cli/index.js'),...args,'--json','--base-url','http://127.0.0.1:'+server.address().port],{env:{...process.env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'},windowsHide:true});let stdout='',stderr='';
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));
 });
 try{
  a.equal((await run(['sms','campaigns','create','--agent','a','--from','+12025550101','--message','Hi {{name}}','--csv',csv,'--set','consent_confirmed=false','--set','scheduled_date=2026-12-01'])).code,0);
  a.deepEqual(seen[0].body.recipients,[{phone:'+12025550100',country:'US',timezone:'America/New_York',variables:{name:'Sam'}}]);
  a.equal(seen[0].body.message_template,'Hi {{name}}');a.equal(seen[0].body.message,undefined);a.equal(seen[0].body.consent_confirmed,false);a.equal(seen[0].body.scheduled_date,'2026-12-01');
  a.equal((await run(['agents','create'])).code,0);a.deepEqual(seen[1].body,{});
  const failure=await run(['agents','get','invalid']);a.equal(failure.code,1);a.deepEqual(JSON.parse(failure.stdout),{error:{...wire.error.error,status:409,request_id:'request-fixture'}});a.ok(!(failure.stdout+failure.stderr).includes('fixture:fixture'));
  a.equal((await run(['calls','list','--agent','a'])).code,0);a.equal(new URL(seen[3].url,'http://localhost').pathname,'/v1/calls/history');
  for(const action of ['on','off']) {
   a.equal((await run(['numbers','web-calls','+12025550100',action])).code,0);
   a.equal(seen.at(-1).url,'/v1/integrations/web-calls/number/%2B12025550100');
   a.deepEqual(seen.at(-1).body,{enabled:action==='on'});
  }
  const before=seen.length;a.notEqual((await run(['numbers','monitor','+12025550100','on'])).code,0);a.equal(seen.length,before);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})}
});
