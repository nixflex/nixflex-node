const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http');
const {Nixflex}=require('../dist/index.cjs');
test('K1 timeout covers a stalled mutation response body without replay',async()=>{
 let hits=0;const server=http.createServer((req,res)=>{hits++;req.resume();res.writeHead(200,{'Content-Type':'application/json'});res.write('{');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'http://127.0.0.1:'+server.address().port,timeoutMs:250,maxRetries:3});
  await a.rejects(c.agents.create({}),e=>e.code==='outcome_unknown'&&e.safe_to_retry===false);a.equal(hits,1);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('K1 old SMS aliases translate once and conflicting fields fail before HTTP',async()=>{
 const original=global.fetch,seen=[];global.fetch=async(u,o)=>{seen.push(JSON.parse(o.body));return Response.json({ok:true})};
 try{const c=new Nixflex({apiKey:'fixture:fixture'});
  await c.sms.campaigns.create({message:'hi',scheduled_at:'2026-12-01'});
  a.deepEqual(seen,[{message_template:'hi',scheduled_date:'2026-12-01'}]);
  a.throws(()=>c.sms.campaigns.create({message:'hi',message_template:'bye'}),/not both/);a.equal(seen.length,1);
 }finally{global.fetch=original}
});
