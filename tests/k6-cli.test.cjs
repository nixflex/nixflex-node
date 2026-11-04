const {test}=require('node:test'),a=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const root=path.join(__dirname,'..'),cli=process.env.K6_PACKED_CLI||path.join(root,'dist/cli/index.js');
const phone='+12025550123',base='/v1/integrations/google-calendar/number/%2B12025550123';
const pair={twilio_sid:'AC'+'a'.repeat(32),twilio_token:'private-fixture'};
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nxf-k6-cli-'));
function run(args,expected={},extras={},input){
 const env={};for(const [k,v]of Object.entries(process.env))if(/^(path|systemroot|windir|temp|tmp)$/i.test(k))env[k]=v;
 Object.assign(env,{USERPROFILE:profile,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K6_EXPECT:JSON.stringify(expected),K6_REQUESTS:expected.method?'1':'0'},extras);
 return spawnSync(process.execPath,['--require',path.join(__dirname,'helpers/k6-cli-fetch.cjs'),cli,...args,'--base-url','https://fixture.invalid','--json'],{env,input,encoding:'utf8'});
}
const status={connected:true,account_email:'p@example.test',calendar_id:'primary',connected_at:null,needs_reconnect:true,send_invites:false};
const hours=Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>[d,null]));
const settings={timezone:'America/New_York',hours,slot_minutes:45,calendar_id:'primary',send_invites:false};
test('K6 CLI exact calendar methods and both private credential input paths; zero-request previews',()=>{
 const rows=[
  [['integrations','connectGoogleCalendar',phone,'--return-url','https://app.example.test/done','--confirm'],{method:'POST',path:base+'/connect',body:{return_url:'https://app.example.test/done'},response:{url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture',expires_at:'2030-01-01T00:10:00Z'}}],
  [['integrations','getGoogleCalendar',phone],{method:'GET',path:base,response:status}],
  [['integrations','disconnectGoogleCalendar',phone,'--confirm'],{method:'DELETE',path:base,response:{ok:true,connected:false}}],
  [['integrations','updateGoogleCalendarSettings',phone,'--body',JSON.stringify({send_invites:false}),'--confirm'],{method:'PATCH',path:base,body:{send_invites:false},response:settings}],
 ];
 for(const [args,expected] of rows){const r=run(args,expected);a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),expected.response);a.ok(!r.stdout.includes('private-fixture'));
  if(expected.method!=='GET'){const p=run(args.filter(v=>v!=='--confirm'));a.equal(p.status,0,p.stderr);a.equal(JSON.parse(p.stdout).sent,false)}
 }
 for(const provider of ['twilio','telnyx']){
  const body=provider==='twilio'?pair:{telnyx_api_key:'private-fixture',telnyx_connection_id:'fixture-app'};
  const expected={method:'POST',path:'/v1/phone-numbers/%2B12025550123/credentials',body,response:{phone_number:phone,provider,updated:true}};
  const args=['numbers','updateCredentials',phone,'--provider',provider,'--confirm'];
  for(const stdin of [false,true]){const r=run([...args,...(stdin?['--credentials-stdin']:[])],expected,stdin?{}:{NIXFLEX_TWILIO_SID:pair.twilio_sid,NIXFLEX_TWILIO_TOKEN:pair.twilio_token,NIXFLEX_TELNYX_API_KEY:'private-fixture',NIXFLEX_TELNYX_CONNECTION_ID:'fixture-app'},stdin?JSON.stringify(body):undefined);
   a.equal(r.status,0,r.stderr);a.deepEqual(JSON.parse(r.stdout),expected.response);a.ok(!(r.stdout+r.stderr).includes('private-fixture'));
  }
  const p=run(args.filter(v=>v!=='--confirm'));a.equal(p.status,0,p.stderr);a.equal(JSON.parse(p.stdout).sent,false);
 }
});
test('K6 CLI rejects secret arguments and bad stdin without echo or request; preserves safe pending-save diagnostics',()=>{
 for(const extra of [['--body','private-fixture'],['--twilio-token=private-fixture'],['--credentials-stdin=private-fixture'],['--key','private-fixture']])for(const prefix of [[],['--json']]){
  const r=run([...prefix,'numbers','updateCredentials',phone,'--provider','twilio','--confirm',...extra]);a.notEqual(r.status,0);a.ok(!(r.stdout+r.stderr).includes('private-fixture'));
 }
 const args=['numbers','updateCredentials',phone,'--provider','twilio','--confirm','--credentials-stdin'];
 for(const input of ['{private-fixture',JSON.stringify({...pair,extra:'private-fixture'})]){const r=run(args,{}, {},input);a.notEqual(r.status,0);a.ok(!(r.stdout+r.stderr).includes('private-fixture'))}
 const r=run(args,{method:'POST',path:'/v1/phone-numbers/%2B12025550123/credentials',body:pair,response:{}},{K6_FAIL:'1'},JSON.stringify(pair));
 a.equal(r.status,1);a.equal(JSON.parse(r.stdout).error.code,'credential_save_pending');a.equal(JSON.parse(r.stdout).error.details.safe_to_retry,false);a.ok(!(r.stdout+r.stderr).includes('private-fixture'));
});
