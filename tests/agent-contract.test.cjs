const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{spawn,spawnSync}=require('node:child_process'),path=require('node:path');
const {Nixflex}=require('../dist/index.cjs');
const settings={temperature:0,incall_sms_enabled:false,post_call_sms_enabled:true,post_call_sms_template:'Thanks',voicemail_leave_enabled:true,voicemail_message:'Call back',stt_confidence:0,stt_max_silence_ms:0,timezone:'Europe/London',data_extraction_fields:[{name:'interest',type:'boolean',optional:true}]};
test('agent contract SDK preserves new fields, zeros, false, warnings and soft-delete response',async()=>{
 const original=global.fetch,seen=[]; global.fetch=async(url,opts)=>{seen.push([url,opts]);return Response.json(opts.method==='DELETE'?{message:'Agent deleted'}:{agent_id:'a',...JSON.parse(opts.body||'{}'),warnings:[{code:'unknown_fields',fields:['typo'],message:'Not saved'}]});};
 try{const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid'});
  const created=await c.agents.create(settings);for(const k of Object.keys(settings))a.deepEqual(created[k],settings[k]);
  const updated=await c.agents.update('a',{temperature:0,typo:1});a.equal(updated.warnings[0].code,'unknown_fields');
  a.deepEqual(await c.agents.delete('a'),{message:'Agent deleted'});a.equal(seen.length,3);
 }finally{global.fetch=original;}
});
test('agent contract real CLI --set forwards structured values without coercion',async()=>{
 const seen=[],server=http.createServer((req,res)=>{let data='';req.on('data',b=>data+=b);req.on('end',()=>{seen.push(JSON.parse(data));res.setHeader('content-type','application/json');res.end(JSON.stringify({agent_id:'a',...seen[0]}));});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const env={};for(const k of ['PATH','Path','SystemRoot','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
  const args=['dist/cli/index.js','agents','create','--name','Contract','--prompt','Help','--json','--base-url','http://127.0.0.1:'+server.address().port];
  for(const [key,value]of Object.entries(settings))args.push('--set',key+'='+(typeof value==='string'?value:JSON.stringify(value)));
  const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:path.join(__dirname,'..'),env:{...env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'}});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>resolve({code,out,err}));});
  a.equal(result.code,0,result.err);for(const k of Object.keys(settings))a.deepEqual(seen[0][k],settings[k]);
 }finally{await new Promise(r=>server.close(r));}
});
test('agent contract TypeScript declarations compile',()=>{
 const r=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','tests/agent-contract-types.ts'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});a.equal(r.status,0,r.stdout+r.stderr);
});
