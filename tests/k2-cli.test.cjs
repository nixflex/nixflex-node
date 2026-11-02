const {test}=require('node:test'),a=require('node:assert/strict');
const http=require('node:http'),path=require('node:path'),{spawn}=require('node:child_process');
test('K2 built CLI reaches new reads and requires explicit unauthenticated signup confirmation',async()=>{
 const seen=[];const server=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{
  seen.push({method:req.method,url:new URL(req.url,'http://fixture'),headers:req.headers,body:body?JSON.parse(body):null});
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true}));
 })});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=args=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.resolve(__dirname,'../dist/cli/index.js'),...args,'--json','--base-url','http://127.0.0.1:'+server.address().port],
  {env:{...process.env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'},windowsHide:true});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>resolve({code,out,err}));});
 try{for(const cmd of [['account','retention'],['keys','activity','--period','7d'],['voices','list','--language','en','--gender','unknown','--locale','en-GB','--agent','a','--agent-language','multi','--availability','all','--limit','1','--cursor','opaque+/='],['voices','get','v/a','--agent-language','en']])a.equal((await run(cmd)).code,0);
  a.deepEqual(seen.map(x=>x.url.pathname),['/v1/account/retention','/v1/keys/activity','/v1/voices','/v1/voices/v%2Fa']);
  a.deepEqual(Object.fromEntries(seen[2].url.searchParams),{agent_id:'a',agent_language:'multi',language:'en',gender:'unknown',locale:'en-GB',availability:'all',limit:'1',cursor:'opaque+/='});
  const preview=await run(['keys','create','--name','Example']);a.equal(preview.code,0);a.ok(JSON.parse(preview.out).would_create);a.equal(seen.length,4);
  a.equal((await run(['keys','create','--confirm','--set','name=null','--set','email=null'])).code,0);
  a.equal(seen[4].url.pathname,'/v1/keys');a.equal(seen[4].headers.authorization,undefined);a.deepEqual(seen[4].body,{name:null,email:null});
  const bad=await run(['keys','create','--confirm','--set','unsupported=true']);a.equal(bad.code,1);a.equal(seen.length,5);
  a.equal((await run(['calls','list','--limit','1','--offset','2'])).code,0);a.equal(seen[5].url.search,'?limit=1&offset=2');
  const callers={callers:[{caller_number:'+12025550101',name:null,reference_id:42}]};
  a.equal((await run(['callers','import','+12025550100','--body',JSON.stringify(callers)])).code,0);
  a.equal(seen[6].url.pathname,'/v1/phone-numbers/%2B12025550100/callers/import');a.deepEqual(seen[6].body,callers);
 }finally{await new Promise(r=>server.close(r))}
});
