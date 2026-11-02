const a=require('node:assert/strict');
const row=JSON.parse(Buffer.from(process.env.K4_CASE,'base64').toString());
let count=0;
global.fetch=async(url,init)=>{
 count++;const u=new URL(url);a.equal(u.pathname,row.path);a.equal(init.method,row.http);
 a.deepEqual(Object.fromEntries(u.searchParams),row.query);a.deepEqual(init.body?JSON.parse(init.body):null,row.body);
 if(process.env.K4_ERROR)return Response.json({error:{code:'server_error',message:'private_fixture_value https://secret.invalid/a',details:{api_key:'private_fixture_value'},doc_url:'https://secret.invalid/a'}},{status:503});
 if(process.env.K4_CSV){let n=0;return new Response(new ReadableStream({pull(c){if(n++===0)c.enqueue(Buffer.from('When,Action,Result\n'));else if(process.env.K4_CSV==='partial')c.error(Error('private_fixture_value'));else c.close()}}),{headers:{'content-type':'text/csv'}})}
 return Response.json(row.response);
};
process.on('exit',()=>a.equal(count,Number(process.env.K4_REQUESTS)));
