const {test}=require('node:test');
const a=require('node:assert/strict');
const {Nixflex,NixflexError,NixflexOutcomeUnknownError,NixflexServerError,NixflexRateLimitError}=require('../dist/index.cjs');
const options={apiKey:'fixture:fixture',baseUrl:'https://offline.invalid',maxRetries:3};
const operations={
 POST:c=>c.calls.create({agent_id:'agent',to_number:'+12025550100',prompt:'Test'}),
 PUT:c=>c.agents.update('agent',{name:'Test'}),
 PATCH:c=>c.phoneNumbers.update('+12025550100',{monitor_enabled:false}),
 DELETE:c=>c.calls.delete('call'),
};
for(const [method,operation] of Object.entries(operations))for(const mode of ['lost','timeout','503','malformed','429','redirect']){
 test(`${method} ${mode}: one attempt, honest outcome`,async()=>{
  const original=global.fetch;let hits=0;
  global.fetch=async(url,opts)=>{
   a.ok(url.startsWith(options.baseUrl));a.equal(opts.method,method);a.equal(opts.redirect,'error');hits++;
   if(mode==='lost')throw new TypeError('synthetic lost reply');
   if(mode==='timeout')throw new DOMException('synthetic timeout','AbortError');
   if(mode==='malformed')return new Response('incomplete',{status:200});
   return new Response(JSON.stringify({error:{code:'synthetic',message:'failed',details:{campaign_id:'test'}}}),
    {status:mode==='redirect'?307:Number(mode),headers:{'x-railway-request-id':'req-test'}});
  };
  try{await a.rejects(operation(new Nixflex(options)),e=>{
   if(mode==='429')return e instanceof NixflexRateLimitError;
   a.ok(e instanceof NixflexError);a.ok(e instanceof NixflexServerError);
   a.ok(e instanceof NixflexOutcomeUnknownError);a.equal(e.outcome,'unknown');a.equal(e.safe_to_retry,false);
   a.match(e.message,/Outcome unknown - check before retrying/);
   if(mode==='503'){a.equal(e.requestId,'req-test');a.equal(e.details.campaign_id,'test');a.equal(e.details.original_code,'synthetic');}
   return true;
  });a.equal(hits,1);}finally{global.fetch=original;}
 });
}
test('all resource methods still route through one successful request',async()=>{
 const original=global.fetch,seen=[];
 global.fetch=async(url,o)=>{a.ok(url.startsWith(options.baseUrl));seen.push([o.method,new URL(url).pathname]);return Response.json({ok:true});};
 const c=new Nixflex(options),phone='+12025550100';
 const calls=[
  ()=>c.agents.list(),()=>c.agents.get('a'),()=>c.agents.create({name:'T',system_prompt:'T'}),()=>c.agents.update('a',{}),()=>c.agents.delete('a'),
  ()=>c.calls.list(),()=>c.calls.get('c'),()=>c.calls.create({}),()=>c.calls.delete('c'),()=>c.calls.deleteAll(),
  ()=>c.campaigns.create({}),()=>c.campaigns.launch('c'),
  ()=>c.phoneNumbers.import({phone_number:phone,agent_id:'a',twilio_sid:'ACfixture',twilio_token:'fixture'}),
  ()=>c.phoneNumbers.list(),()=>c.phoneNumbers.update(phone,{}),()=>c.phoneNumbers.delete(phone),
  ()=>c.phoneNumbers.setMonitor(phone,true),()=>c.phoneNumbers.getMonitor(phone),()=>c.phoneNumbers.setWebCalls(phone,false),()=>c.phoneNumbers.getWebCalls(phone),
  ()=>c.sms.send({}),()=>c.sms.campaigns.create({}),()=>c.sms.campaigns.launch('c'),()=>c.sms.campaigns.list(),()=>c.sms.campaigns.get('c'),()=>c.sms.campaigns.delete('c'),
  ()=>c.keys.rotate(),()=>c.usage.get(),()=>c.webhooks.set(phone,'https://example.test'),()=>c.webhooks.get(phone),()=>c.webhooks.delete(phone),
  ...['storage','llm','tts'].flatMap(k=>[()=>c[k].set({}),()=>c[k].get(),()=>c[k].delete()]),
  ()=>c.callers.get(phone,phone),()=>c.callers.set(phone,phone,{name:'Test'}),()=>c.callers.import(phone,[]),()=>c.callers.delete(phone,phone),
 ];
 try{for(const call of calls)a.deepEqual(await call(),{ok:true});a.equal(seen.length,calls.length);
  for(const verb of ['GET','POST','PUT','PATCH','DELETE'])a.ok(seen.some(x=>x[0]===verb));
 }finally{global.fetch=original;}
});
test('GET network and 5xx retries stay bounded',async()=>{
 const original=global.fetch;
 try{for(const mode of ['network','503']){
  let hits=0;global.fetch=async()=>{hits++;if(mode==='network')throw new TypeError('offline');return Response.json({error:{code:'test'}},{status:503});};
  await a.rejects(new Nixflex({...options,maxRetries:1}).phoneNumbers.list());a.equal(hits,2);
 }}finally{global.fetch=original;}
});
test('proven not-sent refusal stays distinct and is still not automatically repeated',async()=>{
 const original=global.fetch;let hits=0;
 global.fetch=async()=>{hits++;return Response.json({error:{code:'dispatch_safety_unavailable',details:{outcome:'not_sent',sent:false,charged:false,safe_to_retry:true}}},{status:503});};
 try{await a.rejects(operations.POST(new Nixflex(options)),e=>e instanceof NixflexServerError&&!(e instanceof NixflexOutcomeUnknownError)&&e.details.outcome==='not_sent');a.equal(hits,1);}
 finally{global.fetch=original;}
});
test('static signup lost and malformed replies are unknown, without repeating',async()=>{
 const original=global.fetch;
 try{for(const mode of ['lost','malformed','503']){
  let hits=0;global.fetch=async(url,o)=>{a.equal(o.redirect,'error');hits++;if(mode==='lost')throw new TypeError('offline');return new Response('bad',{status:mode==='503'?503:200});};
  await a.rejects(Nixflex.createKey({},options.baseUrl),NixflexOutcomeUnknownError);a.equal(hits,1);
 }}finally{global.fetch=original;}
});
