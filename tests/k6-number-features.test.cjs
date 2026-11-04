const {test}=require('node:test'),a=require('node:assert/strict');
const sdk=require(process.env.K6_PACKED_SDK||'../dist/index.cjs');
const phone='+12025550123',path='/v1/integrations/google-calendar/number/%2B12025550123';
const hours=Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>[d,d==='monday'?['09:00','17:00']:null]));
const settings={timezone:'America/New_York',hours,slot_minutes:45,calendar_id:'primary',send_invites:false};
const status={connected:true,account_email:'person@example.test',calendar_id:'primary',connected_at:'2030-01-01T00:00:00Z',needs_reconnect:true,send_invites:false};
const pair={twilio_sid:'AC'+'a'.repeat(32),twilio_token:'fixture-carrier-secret'};
const client=()=>new sdk.default({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:1});
const cases=[
 ['POST',path+'/connect',{return_url:'https://app.example.test/done'},{url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture',expires_at:'2030-01-01T00:10:00Z'},c=>c.integrations.connectGoogleCalendar(phone,'https://app.example.test/done')],
 ['GET',path,undefined,status,c=>c.integrations.getGoogleCalendar(phone)],
 ['DELETE',path,undefined,{ok:true,connected:false},c=>c.integrations.disconnectGoogleCalendar(phone)],
 ['PATCH',path,settings,settings,c=>c.integrations.updateGoogleCalendarSettings(phone,settings)],
 ['POST','/v1/phone-numbers/%2B12025550123/credentials',pair,{phone_number:phone,provider:'twilio',updated:true},c=>c.phoneNumbers.updateCredentials(phone,pair)],
 ['POST','/v1/phone-numbers/%2B12025550123/credentials',{telnyx_api_key:'fixture-key',telnyx_connection_id:'fixture-app'},{phone_number:phone,provider:'telnyx',updated:true},c=>c.phoneNumbers.updateCredentials(phone,{telnyx_api_key:'fixture-key',telnyx_connection_id:'fixture-app'})],
];
test('K6 every calendar and carrier method sends exact owned-number wire shape, no defaults or secret receipt extras',async()=>{
 const saved=global.fetch;
 try {for(const [method,url,body,response,invoke] of cases){let count=0;
  global.fetch=async(u,init)=>{count++;a.equal(new URL(u).pathname,url);a.equal(init.method,method);a.equal(init.redirect,'error');a.deepEqual(init.body?JSON.parse(init.body):undefined,body);return Response.json({...response, ...(url.endsWith('/credentials')?{twilio_token:'must-never-return'}:{})})};
  a.deepEqual(await invoke(client()),response);a.equal(count,1);
 }
 let sent;global.fetch=async(u,i)=>{sent=JSON.parse(i.body);return Response.json(settings)};
 await client().integrations.updateGoogleCalendarSettings(phone,{send_invites:false});a.deepEqual(sent,{send_invites:false});
 }finally{global.fetch=saved}
});
test('K6 exact calendar/credential error codes are typed, redacted and retain status; writes never retry',async()=>{
 const saved=global.fetch;
 try {for(const kind of ['calendar','credentials'])for(const code of kind==='calendar'?sdk.calendarErrorCodes:sdk.credentialErrorCodes){
  const status=code.endsWith('unavailable')||code==='not_configured'||code==='carrier_outcome_unknown'||code==='credential_save_pending'?503:
   ['number_not_found','number_not_in_account'].includes(code)?404:code==='account_unavailable'?403:code.startsWith('invalid_')?400:409;
  let count=0;global.fetch=async()=>{count++;return Response.json({error:{type:'server_error',code,message:'must-never-return',details:{token:'must-never-return',operation_id:'11111111-1111-4111-8111-111111111111'}}},{status})};
  await a.rejects(kind==='calendar'?client().integrations.connectGoogleCalendar(phone,'https://app.example.test'):client().phoneNumbers.updateCredentials(phone,pair),e=>{
   a.ok(e instanceof (kind==='calendar'?sdk.NixflexCalendarError:sdk.NixflexCredentialError));a.equal(e.code,code);a.equal(e.status,status);
   a.ok(!JSON.stringify(e).includes('must-never-return'));if(status>=500){a.equal(e.safe_to_retry,false);a.equal(e.details.safe_to_retry,false)}return true;
  });a.equal(count,1,code);
 }}finally{global.fetch=saved}
});
test('K6 lost, malformed, redirect and throttled writes never repeat; read status retains bounded retry',async()=>{
 const saved=global.fetch;
 try{for(const row of cases.filter(r=>r[0]!=='GET'))for(const failure of ['lost','malformed',302,429,503]){
  let count=0;global.fetch=async()=>{count++;if(failure==='lost')throw Error('private input');if(failure==='malformed')return new Response('{');return Response.json({error:{code:'unavailable',message:'private input'}},{status:failure})};
  await a.rejects(row[4](client()),e=>{a.ok(!JSON.stringify(e).includes('private input'));if(failure!==429)a.equal(e.safe_to_retry,false);return true});a.equal(count,1);
 }
 let count=0;global.fetch=async()=>{count++;return count===1?Response.json({error:{code:'calendar_unavailable'}},{status:503}):Response.json(status)};
 a.deepEqual(await client().integrations.getGoogleCalendar(phone),status);a.equal(count,2);
 }finally{global.fetch=saved}
});
test('K6 malformed or mixed credential input is rejected without request or value in diagnostics',async()=>{
 const saved=global.fetch;let count=0;global.fetch=async()=>{count++;throw Error('unexpected')};
 try{for(const bad of [{},null,[],{...pair,provider:'twilio'},{...pair,telnyx_api_key:'private'},{twilio_sid:'private',twilio_token:'private'},{telnyx_api_key:'private\n',telnyx_connection_id:'id'}])
  await a.rejects(client().phoneNumbers.updateCredentials(phone,bad),e=>!e.message.includes('private\n')&&!e.message.includes('fixture-carrier-secret'));
  a.equal(count,0);
 }finally{global.fetch=saved}
});
test('K6 SMS suppression is typed 409 conflict; legacy 400 remains invalid request, both one attempt',async()=>{
 const saved=global.fetch;
 try{for(const [status,code,Class] of [[409,'do_not_contact',sdk.NixflexDoNotContactError],[400,'invalid_request',sdk.NixflexInvalidRequestError]]){
  let count=0;global.fetch=async()=>{count++;return Response.json({error:{type:status===409?'conflict':'invalid_request',code,message:'The message was not sent.'}},{status})};
  await a.rejects(client().sms.send({agent_id:'fixture-agent',from_number:phone,to:'+12025550124',message:'Fixture'}),e=>e instanceof Class&&e.status===status&&e.code===code);a.equal(count,1);
 }}finally{global.fetch=saved}
});
