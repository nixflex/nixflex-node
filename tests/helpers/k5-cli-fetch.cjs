const a=require('node:assert/strict');
const row=JSON.parse(Buffer.from(process.env.K5_CASE,'base64').toString());
let requests=0;
global.fetch=async(url,init)=>{
 requests++;const u=new URL(url);a.equal(u.origin,'https://fixture.invalid');a.equal(u.pathname,row.wire_path);a.equal(init.method,row.method);
 a.deepEqual(Object.fromEntries(u.searchParams),Object.fromEntries(Object.entries(row.query).map(([k,v])=>[k,String(v)])));
 a.deepEqual(init.body?JSON.parse(init.body):null,row.body);
 a.equal(init.headers['Idempotency-Key'],row.mutating?'fixture-k5-operation':undefined);
 if(process.env.K5_FAIL)return Response.json({error:{code:'server_error',message:'private-content',details:{text:'private-content'}}},{status:503});
 if(process.env.K5_PARTIAL){let n=0;return new Response(new ReadableStream({pull(c){
  if(n++===0)c.enqueue(Buffer.from('{"text":"private-content'));else c.error(Error('private-content'));
 }}),{headers:{'content-type':'application/json'}})}
 return Response.json(row.response);
};
process.on('exit',()=>a.equal(requests,Number(process.env.K5_REQUESTS)));
