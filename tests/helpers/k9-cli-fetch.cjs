const a=require('node:assert/strict');
const expected=JSON.parse(process.env.K9_EXPECT||'{}');let count=0;
global.fetch=async(url,init)=>{
 count++;const u=new URL(url);a.equal(u.origin,'https://fixture.invalid');a.equal(u.pathname,expected.path);
 a.equal(init.method,'DELETE');a.equal(init.redirect,'error');a.equal(init.body,undefined);
 if(expected.mode==='lost')throw Error('private transport detail');
 if(expected.mode==='malformed')return new Response('{',{status:200});
 return Response.json(expected.response,{status:expected.status||200,headers:{'x-request-id':'request-fixture'}});
};
process.on('exit',()=>a.equal(count,expected.path?1:0,'exactly one DELETE, or zero for preview'));
