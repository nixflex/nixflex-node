const {test}=require('node:test'),a=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const f=require('./fixtures/k7-b56.json'),cli=process.env.K7_PACKED_CLI||path.join(__dirname,'../dist/cli/index.js');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nxf-k7-cli-'));
function run(args,expected={},withKey=true){
 const env={};for(const [k,v]of Object.entries(process.env))if(/^(path|systemroot|windir|temp|tmp)$/i.test(k))env[k]=v;
 Object.assign(env,{USERPROFILE:profile,APPDATA:profile,LOCALAPPDATA:profile,K7_EXPECT:JSON.stringify(expected)});
 if(withKey)env.NIXFLEX_API_KEY='nxf_fixture:nxfs_fixture';
 return spawnSync(process.execPath,['--require',path.join(__dirname,'helpers/k7-cli-fetch.cjs'),cli,...args,'--base-url','https://fixture.invalid','--json'],{env,encoding:'utf8'});
}
test('K7 CLI bookings and outboundRequest send exact escaped URLs and preserve states',()=>{
 for(const value of f.bookings){const r=run(['calls','bookings',f.call],{method:'GET',path:'/v1/calls/'+encodeURIComponent(f.call)+'/bookings',response:value});a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),value)}
 for(const value of f.statuses){const r=run(['calls','outboundRequest',f.id],{method:'GET',path:'/v1/calls/outbound/requests/'+f.id,response:value});a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),value)}
});
test('K7 CLI prepare works without a key, preserves supplied UUID and canonicalizes variables before first send',()=>{
 const r=run(['calls','prepare','--agent',f.base.agent_id,'--to',f.base.to_number,'--from',f.base.from_number,'--prompt',f.base.prompt,'--var','name=Fixture'],{},false);
 a.equal(r.status,0,r.stderr);const prepared=JSON.parse(r.stdout);a.deepEqual({...prepared,request_id:f.id},f.base);a.match(prepared.request_id,/^[0-9a-f-]{36}$/);
 const file=path.join(profile,'prepared-call.json');fs.writeFileSync(file,JSON.stringify(prepared));
 const dry=run(['calls','prepare','--body','@'+file],{},false);a.equal(dry.status,0,dry.stderr);a.deepEqual(JSON.parse(dry.stdout),prepared);
 const receipt={...f.accepted.body,request_id:prepared.request_id};
 const sent=run(['calls','create','--body','@'+file],{method:'POST',path:'/v1/calls/outbound',body:prepared,response:receipt,status:201});
 a.equal(sent.status,0,sent.stderr);a.deepEqual(JSON.parse(sent.stdout),receipt);
});
test('K7 CLI explicit request ID, duplicate replay, lost response and conflict retain the same ID',()=>{
 const {request_id,...body}=f.base,args=['calls','create','--body',JSON.stringify(body),'--request-id',f.id];
 for(const receipt of [f.accepted,f.replay,f.unconfirmed]){const r=run(args,{method:'POST',path:'/v1/calls/outbound',body:f.base,response:receipt.body,status:receipt.status});a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),receipt.body)}
 const same=run(['calls','create','--body',JSON.stringify({...f.base,request_id:f.id.toUpperCase()}),'--request-id',f.id],{method:'POST',path:'/v1/calls/outbound',body:f.base,response:f.replay.body,status:200});
 a.equal(same.status,0,same.stderr);a.deepEqual(JSON.parse(same.stdout),f.replay.body);
 for(const failure of [...f.failures,{lost:true}]){
  const response=structuredClone(failure.body);if(response){response.error.message='private-key-never-print';response.error.details={...response.error.details,token:'private-key-never-print'}}
  const r=run(args,{method:'POST',path:'/v1/calls/outbound',body:f.base,response,status:failure.status,lost:failure.lost});
  a.equal(r.status,1,r.stderr);const e=JSON.parse(r.stdout).error;a.equal(e.code,failure.lost?'outbound_request_unknown':failure.body.error.code);a.equal(e.details.request_id,f.id);a.equal(e.details.safe_to_retry,false);a.ok(!(r.stdout+r.stderr).includes('private-key-never-print'));
 }
});
test('K7 CLI prepare --output saves UTF-8 without BOM, never overwrites and never sends even on write failure',()=>{
 const file=path.join(profile,'unicode-prepared.json'),body={...f.base,prompt:'Synthetic café: مرحباً'};
 const r=run(['calls','prepare','--body',JSON.stringify(body),'--output',file],{},false);a.equal(r.status,0,r.stderr);
 const receipt=JSON.parse(r.stdout);a.equal(receipt.saved,true);a.equal(receipt.sent,false);a.equal(receipt.request_id,f.id);
 const bytes=fs.readFileSync(file);a.equal(bytes[0],123);a.deepEqual(JSON.parse(bytes.toString('utf8')),body);
 a.ok(!r.stdout.includes(body.prompt));
 const again=run(['calls','prepare','--body',JSON.stringify({...body,prompt:'Changed'}),'--output',file],{},false);a.notEqual(again.status,0);a.deepEqual(fs.readFileSync(file),bytes);
 const missing=run(['calls','prepare','--body',JSON.stringify(body),'--output',path.join(profile,'missing','cannot-save.json')],{},false);a.notEqual(missing.status,0);
 a.ok(!fs.readdirSync(profile).some(name=>name.includes('.partial-')));
});
test('K7 CLI bad or conflicting UUID and missing read ID send nothing; no-ID create stays unchanged',()=>{
 for(const args of [['calls','bookings'],['calls','bookings','..'],['calls','outboundRequest','bad'],['calls','create','--body',JSON.stringify(f.base),'--request-id','bad'],
  ['calls','create','--body',JSON.stringify(f.base),'--request-id','d1a6b100-0000-4000-8000-000000000002']]){const r=run(args);a.notEqual(r.status,0)}
 const {request_id,...body}=f.base,receipt={call_id:'legacy',status:'initiated',to:body.to_number,from:body.from_number};
 const r=run(['calls','create','--body',JSON.stringify(body)],{method:'POST',path:'/v1/calls/outbound',body,response:receipt,status:201});a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),receipt);
});
