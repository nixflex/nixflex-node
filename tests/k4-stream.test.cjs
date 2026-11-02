const {test}=require('node:test'),a=require('node:assert/strict');
const {Nixflex}=require(process.env.K4_PACKED_SDK || '../dist/index.cjs');
const config={apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:1};
test('K4 CSV streams chunks, retains UTC filters and string cursor; early cancellation releases body',async()=>{
 const saved=global.fetch;let calls=0,cancelled=0;
 try{
  global.fetch=async(url,init)=>{calls++;a.equal(init.method,'GET');a.equal(init.redirect,'error');a.equal(init.headers.Accept,'text/csv');
   a.deepEqual(Object.fromEntries(new URL(url).searchParams),{format:'csv',from:'2026-10-01',to:'2026-10-31',before:'999999999999999999'});
   return new Response(new ReadableStream({start(c){c.enqueue(Buffer.from('When,Action,Result\n'));},cancel(){cancelled++}}),{headers:{'content-type':'text/csv; charset=utf-8'}});
  };
  const iterator=new Nixflex(config).organisation.activityCsv({from:'2026-10-01',to:'2026-10-31',before:'999999999999999999'});
  a.equal(Buffer.from((await iterator.next()).value).toString(),'When,Action,Result\n');await iterator.return();a.equal(calls,1);a.equal(cancelled,1);
 }finally{global.fetch=saved}
});
test('K4 CSV never retries after a partial body and refuses JSON masquerading as a completed export',async()=>{
 const saved=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;let n=0;return new Response(new ReadableStream({pull(c){if(n++===0)c.enqueue(Buffer.from('When,Action,Result\n'));else c.error(TypeError('private URL detail'))}}),{headers:{'content-type':'text/csv'}})};
  const iterator=new Nixflex(config).organisation.activityCsv();await iterator.next();await a.rejects(iterator.next(),e=>/interrupted/.test(e.message)&&!e.message.includes('private'));a.equal(calls,1);
  global.fetch=async()=>Response.json({error:'not csv'});await a.rejects(async()=>{for await(const chunk of new Nixflex(config).organisation.activityCsv())a.fail('No bytes expected')},/did not return CSV/);
 }finally{global.fetch=saved}
});
test('K4 CSV may retry a failed read before yielding bytes; preserves 403 and cancellation',async()=>{
 const saved=global.fetch;let n=0;
 try{
  global.fetch=async()=>{n++;return n===1?Response.json({error:{code:'server_error'}},{status:503}):new Response('When,Action,Result\n',{headers:{'content-type':'text/csv'}})};
  const chunks=[];for await(const c of new Nixflex(config).organisation.activityCsv())chunks.push(c);a.equal(n,2);a.equal(Buffer.concat(chunks).toString(),'When,Action,Result\n');
  global.fetch=async()=>Response.json({error:{code:'owner_required',message:'refused'}},{status:403});
  await a.rejects(async()=>{for await(const c of new Nixflex(config).organisation.activityCsv())a.fail()},e=>e.status===403&&e.code==='owner_required');
  const controller=new AbortController();controller.abort();n=0;
  global.fetch=async(u,i)=>{n++;if(i.signal.aborted)throw TypeError('aborted');a.fail()};
  await a.rejects(async()=>{for await(const c of new Nixflex(config).organisation.activityCsv({}, {signal:controller.signal}))a.fail()});a.equal(n,1);
 }finally{global.fetch=saved}
});
