const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const cases=require('./fixtures/k5-cases.json'),cli=process.env.K5_PACKED_CLI||path.join(__dirname,'../dist/cli/index.js');
function run(row,args=row.cli,extra={}){
 const env={PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,USERPROFILE:os.tmpdir(),
  NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K5_CASE:Buffer.from(JSON.stringify(row)).toString('base64'),K5_REQUESTS:'1',...extra};
 return spawnSync(process.execPath,['--require',path.join(__dirname,'helpers/k5-cli-fetch.cjs'),cli,...args,'--base-url','https://fixture.invalid','--json'],
  {env,encoding:'utf8',timeout:20000,windowsHide:true});
}
test('K5 built CLI covers all JSON knowledge operations, encoded identifiers and confirmation before every POST/change',()=>{
 for(const row of cases.filter(r=>r.number!==128)){
  const r=run(row);a.equal(r.status,0,row.name+': '+r.stderr+r.stdout);a.deepEqual(JSON.parse(r.stdout),row.response);
  if(row.method!=='GET'){
   const preview=run(row,row.cli.filter(s=>s!=='--confirm'),{K5_REQUESTS:'0'});
   a.equal(preview.status,0,row.name+': '+preview.stderr);a.equal(JSON.parse(preview.stdout).sent,false);
  }
 }
 for(const name of ['uploadSource','replaceSourceFile','measureFile']){
  const preview=run(cases[0],['knowledge',name,'kb','--file','never-opened-file'],{K5_REQUESTS:'0'});
  a.equal(preview.status,0);a.equal(JSON.parse(preview.stdout).sent,false);
 }
});
test('K5 CLI unknown outcomes keep safe_to_retry false and never print customer error content',()=>{
 const row=cases.find(r=>r.name==='addSource'),result=run(row,row.cli,{K5_FAIL:'1'});
 a.equal(result.status,1);a.ok(!/private-content/.test(result.stdout+result.stderr));
 const err=JSON.parse(result.stdout).error;a.equal(err.code,'outcome_unknown');a.equal(err.safe_to_retry,false);
});
test('K5 CLI publishes only complete JSON exports, cleans partial output and never overwrites an existing export',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nixflex-k5-export-')),row=cases.find(r=>r.number===128),output=path.join(dir,'knowledge.json');
 try{
  const args=[...row.cli,'--output',output];
  const partial=run(row,args,{K5_PARTIAL:'1'});a.equal(partial.status,1);a.ok(!/private-content/.test(partial.stdout+partial.stderr));a.deepEqual(fs.readdirSync(dir),[]);
  const good=run(row,args);a.equal(good.status,0,good.stdout+good.stderr);a.equal(JSON.parse(good.stdout).saved,true);
  a.deepEqual(JSON.parse(fs.readFileSync(output)),row.response);
  const again=run(row,args);a.equal(again.status,1);a.deepEqual(JSON.parse(fs.readFileSync(output)),row.response);a.deepEqual(fs.readdirSync(dir),['knowledge.json']);
 }finally{a.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'nixflex-k5-export-'));fs.rmSync(dir,{recursive:true,force:true})}
});
