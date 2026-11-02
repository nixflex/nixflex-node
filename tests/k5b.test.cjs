const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {default:Nixflex,NixflexNotFoundError}=require(process.env.K5_PACKED_SDK||'../dist/index.cjs');
const cli=process.env.K5_PACKED_CLI||path.resolve(__dirname,'../dist/cli/index.js');
test('K5b declarations expose exactly the six B49g keyterm fields',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k5b-keyterms-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
test('K5b caller 404 preserves NotFound class and exact code without retry',async()=>{
 const original=global.fetch;
 try{for(const code of ['caller_not_found','phone_number_not_found','not_found']){
  let sent=0;global.fetch=async(url,init)=>{sent++;a.equal(String(url),'https://fixture.invalid/v1/phone-numbers/%2B12025550123/callers/%2B12025550101');a.equal(init.method,'GET');return Response.json({error:{code,type:'not_found',message:'Private fixture'}},{status:404})};
  const c=new Nixflex({apiKey:'nxf_fixture:nxfs_fixture',baseUrl:'https://fixture.invalid'});
  await a.rejects(c.callers.get('+12025550123','+12025550101'),e=>e instanceof NixflexNotFoundError&&e.name==='NixflexNotFoundError'&&e.status===404&&e.code===code);a.equal(sent,1);
 }}finally{global.fetch=original}
});
test('K5b built CLI caller 404 retains status/code without printing a key',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nxf-k5b-')),loader=path.join(dir,'fake.mjs');
 fs.writeFileSync(loader,"let sent=0;globalThis.fetch=async(url,init)=>{if(++sent!==1||init.method!=='GET'||String(url)!=='https://fixture.invalid/v1/phone-numbers/%2B12025550123/callers/%2B12025550101')throw Error('Wrong request');return Response.json({error:{code:process.env.K5B_CODE,type:'not_found',message:'Private fixture'}},{status:404})};");
 const env={};for(const [k,v]of Object.entries(process.env))if(/^(path|systemroot|windir|temp|tmp)$/i.test(k))env[k]=v;
 for(const code of ['caller_not_found','phone_number_not_found','not_found']){
  const result=spawnSync(process.execPath,['--import',pathToFileURL(loader).href,cli,'callers','get','+12025550123','+12025550101','--json','--base-url','https://fixture.invalid'],{env:{...env,HOME:dir,USERPROFILE:dir,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K5B_CODE:code},encoding:'utf8',windowsHide:true});
  a.equal(result.status,1);const error=JSON.parse(result.stdout).error;a.equal(error.status,404);a.equal(error.code,code);a.ok(!(result.stdout+result.stderr).includes('nxf_fixture:nxfs_fixture'));
 }
});
