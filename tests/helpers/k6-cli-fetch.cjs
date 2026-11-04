const a=require('node:assert/strict');
const expected=JSON.parse(process.env.K6_EXPECT||'{}');let requests=0;
global.fetch=async(url,init)=>{
 requests++;a.equal(new URL(url).origin,'https://fixture.invalid');a.equal(new URL(url).pathname,expected.path);
 a.equal(init.method,expected.method);a.equal(init.redirect,'error');a.deepEqual(init.body?JSON.parse(init.body):undefined,expected.body);
 if(process.env.K6_FAIL)return Response.json({error:{code:'credential_save_pending',message:'private-fixture',details:{token:'private-fixture'}}},{status:503});
 return Response.json({...expected.response,refresh_token:'private-fixture',twilio_token:'private-fixture'});
};
process.on('exit',()=>a.equal(requests,Number(process.env.K6_REQUESTS||0),'expected fake request count'));
