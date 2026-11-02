const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {default:Nixflex}=require(process.env.K5_PACKED_SDK||'../dist/index.cjs');
const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:1});
test('K5 file uploads stream bounded chunks with fixed headers, one request and zero requests for oversize files',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nixflex-k5-upload-')),saved=global.fetch;
 try{
  const file=path.join(dir,'example.txt');fs.writeFileSync(file,Buffer.alloc(200000,65));let calls=0;
  global.fetch=async(url,init)=>{
   calls++;a.equal(init.method,'POST');a.equal(init.redirect,'error');a.equal(init.headers['Content-Type'],'application/octet-stream');
   a.equal(init.headers['X-Filename'],'example.txt');a.equal(init.headers['Idempotency-Key'],'fixture-k5-operation');
   a.equal(init.headers['Content-Length'],'200000');a.equal(init.headers['X-Review'],'true');
   let bytes=0,chunks=0;for await(const chunk of init.body){a.ok(chunk.length<=65536);bytes+=chunk.length;chunks++}
   a.equal(bytes,200000);a.ok(chunks>1);return Response.json({id:'job',state:'pending'});
  };
  a.equal((await c.knowledge.uploadSource('kb',file,{idempotencyKey:'fixture-k5-operation',review:true})).state,'pending');a.equal(calls,1);
  fs.truncateSync(file,10*1024*1024+1);
  await a.rejects(c.knowledge.uploadSource('kb',file,{idempotencyKey:'fixture-k5-operation'}),/10 MiB/);a.equal(calls,1);
  fs.truncateSync(file,10);
  await a.rejects(c.knowledge.replaceSourceFile('kb','source',file,{idempotencyKey:'fixture-k5-operation'}),/expectedRevision/);a.equal(calls,1);
  global.fetch=async()=>{calls++;throw Error('private-content')};
  await a.rejects(c.knowledge.uploadSource('kb',file,{idempotencyKey:'fixture-k5-operation'}),e=>e.code==='outcome_unknown'&&e.safe_to_retry===false);a.equal(calls,2);
 }finally{
  global.fetch=saved;a.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'nixflex-k5-upload-'));fs.rmSync(dir,{recursive:true,force:true});
 }
});
test('K5 download streams exact JSON bytes and never retries a partial export or exposes private transport errors',async()=>{
 const saved=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;let n=0;return new Response(new ReadableStream({pull(ctrl){
   if(n++===0)ctrl.enqueue(Buffer.from('{"private":'));else ctrl.error(Error('private-content'));
  }}),{headers:{'content-type':'application/json'}})};
  const result=c.knowledge.downloadExport('job',{format:'text'});a.equal(Buffer.from((await result.next()).value).toString(),'{"private":');
  await a.rejects(result.next(),e=>!e.message.includes('private-content'));a.equal(calls,1);
  calls=0;global.fetch=async()=>{calls++;if(calls===1)throw Error('private-content');return Response.json({filename:'knowledge.txt',text:'example'})};
  const chunks=[];for await(const chunk of c.knowledge.downloadExport('job'))chunks.push(Buffer.from(chunk));
  a.equal(JSON.parse(Buffer.concat(chunks)).text,'example');a.equal(calls,2);
  global.fetch=async()=>new Response('private-content',{headers:{'content-type':'text/html'}});
  await a.rejects(c.knowledge.downloadExport('job').next(),/did not return JSON/);
 }finally{global.fetch=saved}
});
