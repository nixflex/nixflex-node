const a=require('node:assert/strict');
const expected=JSON.parse(process.env.K7_EXPECT||'{}');let requests=0;
global.fetch=async(url,init)=>{
 requests++;const u=new URL(url);a.equal(u.origin,'https://fixture.invalid');a.equal(u.pathname,expected.path);a.equal(u.search,'');
 a.equal(init.method,expected.method);a.equal(init.redirect,'error');a.deepEqual(init.body?JSON.parse(init.body):undefined,expected.body);
 if(expected.lost)throw Error('private-key-never-print');
 return Response.json(expected.response,{status:expected.status||200});
};
process.on('exit',()=>a.equal(requests,expected.method?1:0,'expected fake request count'));
