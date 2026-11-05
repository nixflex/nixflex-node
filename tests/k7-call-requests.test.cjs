const {test}=require('node:test'),a=require('node:assert/strict');
const sdk=require(process.env.K7_PACKED_SDK||'../dist/index.cjs');
const fixture=require('./fixtures/k7-b56.json');
const {id,call,base,bookings,accepted,replay,unconfirmed,failures,statuses}=fixture;
const client=(maxRetries=0)=>new sdk.default({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries});
const mock=async(fetch,fn)=>{const saved=global.fetch;global.fetch=fetch;try{return await fn()}finally{global.fetch=saved}};
const classes={outbound_request_pending:sdk.NixflexOutboundRequestPendingError,outbound_request_unknown:sdk.NixflexOutboundRequestUnknownError,
 request_id_conflict:sdk.NixflexRequestIdConflictError,outbound_request_unavailable:sdk.NixflexOutboundRequestUnavailableError};
test('K7 booking read preserves all five engine states, ordered timeline, rotated UID and nulls',async()=>{
 for(const value of bookings){let count=0;await mock(async(url,init)=>{count++;a.equal(init.method,'GET');a.equal(init.body,undefined);
  a.equal(new URL(url).pathname,'/v1/calls/'+encodeURIComponent(call)+'/bookings');a.equal(new URL(url).search,'');return Response.json(value)},async()=>{
   const got=await client().calls.bookings(call);a.deepEqual(got,value);
   if(got.state==='ready'){a.deepEqual(got.result.final.map(r=>r.booking_uid),['two','three']);a.equal(got.result.final[0].status,'cancelled');a.equal(got.result.timeline[1].booking_uid,'one');}
  });a.equal(count,1);
 }
});
test('K7 booking projection strips private fields but never converts incomplete or deleted content to none',async()=>{
 const ready=structuredClone(bookings[0]);ready.internal='private';ready.result._call_booking_result='private';ready.result.timeline[0]._call_booking='private';ready.result.final[0].token='private';
 await mock(async()=>Response.json(ready),async()=>a.deepEqual(await client().calls.bookings(call),bookings[0]));
 const bad=[null,{}, {...bookings[0],call_id:'foreign'}, {...bookings[1],result:{}},
  {...bookings[0],result:{...bookings[0].result,final:[]}}, {...bookings[0],result:{...bookings[0].result,call_id:'foreign'}}];
 for(const value of bad)await mock(async()=>Response.json(value),()=>a.rejects(client().calls.bookings(call),sdk.NixflexConnectionError));
});
test('K7 request read preserves four states and exact UUID path; invalid states never imply a retry',async()=>{
 for(const value of statuses)await mock(async(url,init)=>{a.equal(init.method,'GET');a.equal(init.body,undefined);a.equal(new URL(url).pathname,'/v1/calls/outbound/requests/'+id);return Response.json({...value,internal:'hidden'})},
  async()=>a.deepEqual(await client().calls.outboundRequest(id),value));
 for(const value of [{...statuses[0],state:'failed'},{...statuses[1],call_id:null},{...statuses[0],request_id:'another'},{request_id:id,state:'pending'}])
  await mock(async()=>Response.json(value),()=>a.rejects(client().calls.outboundRequest(id),sdk.NixflexConnectionError));
});
test('K7 prepare is local, deep copies inputs and preserves an explicitly saved UUID',async()=>{
 let sent=0;await mock(async()=>{sent++;throw Error('No HTTP')},async()=>{
  const {request_id,...input}=structuredClone(base),one=sdk.prepareOutboundCall(input),two=client().calls.prepare(input);
  a.match(one.request_id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);a.notEqual(one.request_id,two.request_id);
  input.dynamic_vars.name='Changed';a.equal(one.dynamic_vars.name,'Fixture');a.equal(input.request_id,undefined);
  a.deepEqual(client().calls.prepare(base),base);a.equal(sent,0);
 });
});
test('K7 explicit UUID accepts 201, replay 200 without to/from, and known acceptance with journal outage',async()=>{
 for(const receipt of [accepted,replay,unconfirmed]){let count=0;await mock(async(url,init)=>{
  count++;a.equal(new URL(url).pathname,'/v1/calls/outbound');a.equal(init.method,'POST');a.equal(init.redirect,'error');a.deepEqual(JSON.parse(init.body),base);
  return Response.json(receipt.body,{status:receipt.status});
 },async()=>a.deepEqual(await client(3).calls.create(base),receipt.body));a.equal(count,1);}
});
test('K7 manual same-ID replay sends identical intent and changed input reports conflict without a third attempt',async()=>{
 const seen=[];await mock(async(_,init)=>{const input=JSON.parse(init.body);seen.push(input);
  return Response.json((seen.length===1?accepted:input.prompt===base.prompt?replay:failures[2]).body,{status:seen.length===1?201:input.prompt===base.prompt?200:409});
 },async()=>{
  const c=client(3);a.equal((await c.calls.create(base)).call_id,'fixture-call');a.equal((await c.calls.create(base)).replayed,true);
  await a.rejects(c.calls.create({...base,prompt:'Changed intent'}),sdk.NixflexRequestIdConflictError);
 });a.equal(seen.length,3);a.deepEqual(seen[0],seen[1]);a.equal(seen[2].request_id,id);
});
test('K7 four engine errors retain typed code, HTTP status and UUID, hide private details, never repeat POST',async()=>{
 for(const failure of failures){let count=0;const payload=structuredClone(failure.body);payload.error.message='private-response';payload.error.details={...payload.error.details,token:'private-response'};
  await mock(async()=>{count++;return Response.json(payload,{status:failure.status})},()=>a.rejects(client(3).calls.create(base),e=>{
   a.ok(e instanceof classes[failure.body.error.code]);a.equal(e.code,failure.body.error.code);a.equal(e.status,failure.status);a.equal(e.request_id,id);
   a.equal(e.details.safe_to_retry,false);if(failure.body.error.details?.state)a.equal(e.details.state,failure.body.error.details.state);
   a.ok(!JSON.stringify(e).includes('private-response'));a.ok(!e.message.includes('private-response'));return true;
  }));a.equal(count,1);
 }
});
test('K7 lost, malformed, wrong-identity and incomplete POST replies are unknown with original UUID and zero automatic retries',async()=>{
 for(const value of ['lost','bad-json',null,{}, {...accepted.body,request_id:'foreign'}, {...accepted.body,call_id:'line\nbreak'},
  {...accepted.body,replayed:false},{...accepted.body,request_status:'unconfirmed'}, {...accepted.body,safe_to_retry:true}]){
  let count=0;await mock(async()=>{count++;if(value==='lost')throw Error('private-network');return value==='bad-json'?new Response('{',{status:201}):Response.json(value,{status:201})},
   ()=>a.rejects(client(3).calls.create(base),e=>e instanceof sdk.NixflexOutboundRequestUnknownError&&e.request_id===id&&e.details.safe_to_retry===false));a.equal(count,1);
 }
});
test('K7 invalid UUID fails before HTTP; no-ID requests and responses keep legacy bytes',async()=>{
 let count=0;await mock(async()=>{count++;throw Error('No HTTP')},async()=>{
  for(const request_id of [null,'',7,{},'00000000-0000-0000-0000-000000000000','x'.repeat(36)]){
   a.throws(()=>sdk.prepareOutboundCall({...base,request_id}),TypeError);
   await a.rejects(client().calls.create({...base,request_id}),TypeError);
   await a.rejects(client().calls.outboundRequest(request_id),TypeError);
  }
  for(const bad of [null,7,'','.', '..','line\nbreak','x'.repeat(201)])await a.rejects(client().calls.bookings(bad),TypeError);
  a.equal(count,0);
 });
 const {request_id,...legacy}=base,receipt={call_id:'legacy',status:'initiated',to:base.to_number,from:base.from_number};
 await mock(async(_,init)=>{a.deepEqual(JSON.parse(init.body),legacy);return Response.json(receipt,{status:201})},async()=>a.deepEqual(await client().calls.create(legacy),receipt));
});
test('K7 read errors distinguish not-found from unavailable; GET alone retains the bounded retry policy',async()=>{
 for(const kind of ['booking','request']){const method=c=>kind==='booking'?c.calls.bookings(call):c.calls.outboundRequest(id);
  const code=kind==='booking'?'call_bookings_unavailable':'outbound_request_unavailable',Class=kind==='booking'?sdk.NixflexCallBookingsUnavailableError:sdk.NixflexOutboundRequestUnavailableError;
  await mock(async()=>Response.json({error:{code:'not_found',message:'Not found'}},{status:404}),()=>a.rejects(method(client()),sdk.NixflexNotFoundError));
  await mock(async()=>Response.json({error:{code,message:'private-error'}},{status:503}),()=>a.rejects(method(client()),e=>e instanceof Class&&e.status===503&&!JSON.stringify(e).includes('private-error')));
  let count=0;await mock(async()=>{count++;return count===1?Response.json({error:{code}},{status:503}):Response.json(kind==='booking'?bookings[1]:statuses[0])},()=>method(client(1)));a.equal(count,2);
 }
});
test('K7 caller abort after sending retains saved UUID, does not cancel the remote call or automatically retry',async()=>{
 const controller=new AbortController();let entered,count=0;
 const waiting=new Promise(resolve=>entered=resolve);
 await mock(async(_,init)=>{count++;entered();return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(Error('private-abort')),{once:true}))},async()=>{
  const promise=client(3).calls.create(base,{signal:controller.signal});await waiting;controller.abort();
  await a.rejects(promise,e=>e instanceof sdk.NixflexOutboundRequestUnknownError&&e.request_id===id&&e.details.safe_to_retry===false);a.equal(count,1);
 });
});
