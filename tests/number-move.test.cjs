const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{spawn}=require('node:child_process');
const path=require('node:path'),{Nixflex}=require('../dist/index.cjs');
test('D7 SDK move/update send only agent_id, encode plus and preserve no-op; never retry unknown moves',async()=>{
 const old=global.fetch,seen=[];let status=200;
 global.fetch=async(url,opts)=>{seen.push({url:String(url),opts});return new Response(JSON.stringify(status===200?
  {phone_number:{phone_number:'+12025550186',agent_id:'target',agent_name:'Ggg',changed:false}}:{error:{code:'number_move_unconfirmed',message:'Check before retrying'}}),{status});};
 try{const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.example.test',maxRetries:5});
  a.equal((await c.phoneNumbers.move('+12025550186','target')).phone_number.changed,false);
  await c.phoneNumbers.update('+12025550186',{agent_id:'target'});
  for(const r of seen){a.match(r.url,/%2B12025550186$/);a.equal(r.opts.method,'PATCH');a.deepEqual(JSON.parse(r.opts.body),{agent_id:'target'});}
  a.throws(()=>c.phoneNumbers.update('+12025550186',{agent_id:'target',web_prompt:'change'}),/separately/);
  status=503;await a.rejects(c.phoneNumbers.move('+12025550186','target'));a.equal(seen.length,3);
 }finally{global.fetch=old;}
});
test('D7 CLI move and update --agent each make one PATCH; mixed settings are refused',async()=>{
 const seen=[],s=http.createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;
  seen.push({url:req.url,method:req.method,body:JSON.parse(body)});res.setHeader('content-type','application/json');res.end('{"phone_number":{"agent_id":"target","changed":true}}');});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));
 const run=args=>new Promise((resolve,reject)=>{
  const env={NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'};for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];
  const child=spawn(process.execPath,[path.resolve(__dirname,'../dist/cli/index.js'),...args,'--json','--base-url','http://127.0.0.1:'+s.address().port],{env,windowsHide:true});
  let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);child.on('error',reject);child.on('exit',code=>resolve({code,out,err}));
 });
 try{for(const cmd of ['move','update']){const r=await run(['numbers',cmd,'+12025550186','--agent','target']);a.equal(r.code,0,r.out+r.err);}
  const bad=await run(['numbers','update','+12025550186','--agent','target','--set','web_prompt=change']);a.equal(bad.code,1);a.equal(seen.length,2);
  for(const r of seen){a.equal(r.method,'PATCH');a.equal(r.url,'/v1/phone-numbers/%2B12025550186');a.deepEqual(r.body,{agent_id:'target'});}
 }finally{await new Promise(r=>s.close(r));}
});
