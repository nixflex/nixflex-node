const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{spawn,spawnSync}=require('node:child_process'),path=require('node:path');
const {Nixflex}=require('../dist/index.cjs');
const flags=Object.fromEntries(['inbound_enabled','outbound_enabled','sms_reply_enabled','web_agent_enabled','web_calls_enabled','web_functions_enabled','monitor_enabled'].map(k=>[k,false]));
test('Group2 SDK encoded get, paged filters, legacy list and all seven booleans use the existing transport',async()=>{
  const original=global.fetch,seen=[];
  global.fetch=async(url,options)=>{seen.push([new URL(url),options]);return Response.json({phone_numbers:[],count:0,next_cursor:null,has_more:false});};
  try {const client=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid'});
    await client.phoneNumbers.get('+12025550100');a.equal(seen[0][0].pathname,'/v1/phone-numbers/%2B12025550100');a.equal(seen[0][1].method,'GET');
    await client.phoneNumbers.list({agent_id:'a',provider:'telnyx',limit:1,cursor:'opaque'});a.equal(seen[1][0].search,'?agent_id=a&provider=telnyx&limit=1&cursor=opaque');
    await client.phoneNumbers.list();a.equal(seen[2][0].search,'');
    await client.phoneNumbers.update('+12025550100',flags);a.deepEqual(JSON.parse(seen[3][1].body),flags);
    await client.phoneNumbers.getMonitor('+12025550100');await client.phoneNumbers.getWebCalls('+12025550100');
    a.match(seen[4][0].pathname,/integrations\/monitor/);a.match(seen[5][0].pathname,/integrations\/web-calls/);
  } finally {global.fetch=original;}
});
function cli(args,base){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(__dirname,'../dist/cli/index.js'),...args,'--json','--base-url',base],{env:{...process.env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'},stdio:['ignore','pipe','pipe']});
  let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>resolve({code,out,err}));
});}
test('Group2 real CLI get/list and seven --set booleans reach only the local fake API',async()=>{
  const seen=[];const listener=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{seen.push({url:req.url,method:req.method,body});res.setHeader('content-type','application/json');res.end(JSON.stringify({phone_number:{source:'api'},phone_numbers:[],count:0,next_cursor:null}));});});
  await new Promise(r=>listener.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+listener.address().port;
  try {
    for(const args of [['numbers','get','+12025550100'],['numbers','list','--provider','telnyx','--agent','a','--limit','1','--cursor','opaque'],['numbers','update','+12025550100',...Object.entries(flags).flatMap(([k,v])=>['--set',k+'='+v])]]){
      const r=await cli(args,base);a.equal(r.code,0,r.err);a.equal(JSON.parse(r.out).count,0);
    }
    a.equal(seen[0].url,'/v1/phone-numbers/%2B12025550100');a.equal(seen[1].url,'/v1/phone-numbers?agent_id=a&provider=telnyx&limit=1&cursor=opaque');a.deepEqual(JSON.parse(seen[2].body),flags);
    a.equal((await cli(['numbers','list','--limit','1.5'],base)).code,1);a.equal(seen.length,3);
  } finally {await new Promise(r=>listener.close(r));}
});
test('Group2 public types compile: pagination, read-only source and seven switches',()=>{
  const r=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','tests/group2-types.ts'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});a.equal(r.status,0,r.stdout+r.stderr);
});
