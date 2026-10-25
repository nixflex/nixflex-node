const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{spawn,spawnSync}=require('node:child_process'),path=require('node:path');
const {Nixflex}=require('../dist/index.cjs');
test('Group3 SDK usage is an encoded GET, preserves decimal cost and supports omitted or every explicit period',async()=>{
 const original=global.fetch,seen=[];global.fetch=async(url,options)=>{seen.push([new URL(url),options]);return Response.json({usage:{total_cost:'0.12345678',unused:true,web_chats:4}});};
 try {const client=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid'});
  a.equal((await client.phoneNumbers.usage('+12025550100')).usage.total_cost,'0.12345678');
  a.equal(seen[0][0].pathname,'/v1/phone-numbers/%2B12025550100/usage');a.equal(seen[0][0].search,'');
  for(const period of ['today','7','14','30','90','all'])await client.phoneNumbers.usage('+12025550100',{period,time_zone:'Europe/London'});
  for(const [url,opts] of seen){a.equal(opts.method,'GET');a.equal(opts.body,undefined);a.ok(!url.searchParams.has('owner'));}
  a.equal(seen.at(-1)[0].searchParams.get('time_zone'),'Europe/London');
 } finally {global.fetch=original;}
});
function cli(args,base){return new Promise((resolve,reject)=>{
 const env={};for(const k of ['PATH','Path','SystemRoot','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
 const child=spawn(process.execPath,[path.join(__dirname,'../dist/cli/index.js'),'numbers','usage',...args,'--json','--base-url',base],{env:{...env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'},stdio:['ignore','pipe','pipe']});
 let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>resolve({code,out,err}));
});}
test('Group3 real CLI usage makes read-only requests; invalid period or zone never contacts the API',async()=>{
 const seen=[],listener=http.createServer((req,res)=>{seen.push([req.method,req.url]);res.setHeader('content-type','application/json');res.end(JSON.stringify({usage:{total_cost:'0.01'}}));});
 await new Promise(r=>listener.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+listener.address().port;
 try {for(const args of [['+12025550100'],['+12025550100','--period','30','--time-zone','Europe/London']]){const r=await cli(args,base);a.equal(r.code,0,r.err);a.equal(JSON.parse(r.out).usage.total_cost,'0.01');}
  a.deepEqual(seen,[['GET','/v1/phone-numbers/%2B12025550100/usage?period=all&time_zone=UTC'],['GET','/v1/phone-numbers/%2B12025550100/usage?period=30&time_zone=Europe%2FLondon']]);
  for(const args of [[],['bad'],['+12025550100','--period','1'],['+12025550100','--time-zone','Fake/Zone']])a.equal((await cli(args,base)).code,1);
  a.equal(seen.length,2);
 } finally {await new Promise(r=>listener.close(r));}
});
test('Group3 usage public TypeScript declarations compile with typed periods and exact monetary strings',()=>{
 const r=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','tests/group3-types.ts'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});a.equal(r.status,0,r.stdout+r.stderr);
});
