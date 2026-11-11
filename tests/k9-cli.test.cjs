const {test}=require('node:test'),a=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const cli=process.env.K9_PACKED_CLI||path.join(__dirname,'../dist/cli/index.js');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nxf-k9-cli-'));
function run(args,expected={}){
 const env={};for(const [k,v]of Object.entries(process.env))if(/^(path|systemroot|windir|temp|tmp)$/i.test(k))env[k]=v;
 Object.assign(env,{USERPROFILE:profile,APPDATA:profile,LOCALAPPDATA:profile,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K9_EXPECT:JSON.stringify(expected)});
 return spawnSync(process.execPath,['--require',path.join(__dirname,'helpers/k9-cli-fetch.cjs'),cli,...args,'--base-url','https://fixture.invalid','--json'],{env,encoding:'utf8'});
}
const rows=[
 {args:['calls','delete','c/+'],path:'/v1/calls/c%2F%2B',body:{call_id:'c/+',deleted:true,recording_deleted:true,recording_cleanup:'carrier_best_effort'}},
 {args:['campaigns','delete','v/+'],path:'/v1/calls/batch/v%2F%2B',body:{campaign_id:'v/+',deleted:true,message:'Campaign deleted'}},
 {args:['sms','campaigns','delete','s/+'],path:'/v1/sms/campaigns/s%2F%2B',body:{campaign_id:'s/+',deleted:true,message:'Campaign deleted'}},
 {args:['calls','delete-all'],path:'/v1/calls',body:{deleted:true,calls_deleted:1,recordings_deleted:1,sms_deleted:0}},
];
test('K9 voice-delete preview and missing ID send zero requests; help explains pending deletion',()=>{
 const preview=run(['campaigns','delete','fixture']);a.equal(preview.status,0,preview.stderr);a.match(JSON.parse(preview.stdout).would_delete,/voice campaign fixture/);
 a.notEqual(run(['campaigns','delete','--confirm']).status,0);
 const help=spawnSync(process.execPath,[cli,'--help'],{encoding:'utf8'});a.equal(help.status,0);
 a.match(help.stdout,/campaigns delete <campaign_id> --confirm/);a.match(help.stdout,/hangup_pending/);a.match(help.stdout,/history\/charges stay/);
});
for(const row of rows)test('K9 CLI '+row.args.join(' ')+' preserves receipts and safe errors',()=>{
 for(const mode of ['success','already-gone','403','404','queued','503','lost','malformed']){
  const status=mode==='success'?200:mode==='queued'||mode==='503'?503:mode==='403'?403:404;
  const code=mode==='queued'?'hangup_pending':status===404?'not_found':status===403?'permission_denied':'deletion_unavailable';
  const details=mode==='queued'?{deleted:false,retry_pending:true}:{deleted:false,evidence:'fixture'};
  const response=mode==='success'?row.body:{error:{type:status===503?'server_error':'refused',code,message:'Not confirmed.',details}};
  const r=run([...row.args,'--confirm'],{path:row.path,response,status,mode});
  if(mode==='success'){a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),row.body)}
  else{a.equal(r.status,1,r.stderr);const e=JSON.parse(r.stdout).error;
   if(mode==='queued'&&row.path!=='/v1/calls'){a.equal(e.code,'hangup_pending');a.equal(e.status,503);a.deepEqual(e.details,details);a.equal(e.outcome,undefined)}
   else if(['queued','503','lost','malformed'].includes(mode)){a.equal(e.code,'outcome_unknown');a.equal(e.safe_to_retry,false);if(mode==='503')a.equal(e.details.original_code,'deletion_unavailable')}
   else{a.equal(e.code,code);a.equal(e.status,status);a.deepEqual(e.details,details)}
   a.ok(!(r.stdout+r.stderr).includes('private transport detail'));
  }
 }
});
