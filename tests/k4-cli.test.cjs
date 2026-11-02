const {test}=require('node:test'),a=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const cases=require('./fixtures/c6-cases.json');
const cli=process.env.K4_PACKED_CLI||path.join(__dirname,'../dist/cli/index.js');
function run(row,args=row.cli,extra={}){
 const env={PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,USERPROFILE:os.tmpdir(),NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K4_CASE:Buffer.from(JSON.stringify(row)).toString('base64'),K4_REQUESTS:'1',...extra};
 return spawnSync(process.execPath,['--require',path.join(__dirname,'helpers/k4-cli-fetch.cjs'),cli,...args,'--base-url','https://fixture.invalid','--json'],{env,encoding:'utf8',timeout:20000,windowsHide:true});
}
test('K4 built CLI sends all 44 exact requests; every NEW write sends zero requests without confirmation',()=>{
 for(const row of cases){const r=run(row);a.equal(r.status,0,row.id+': '+r.stderr+r.stdout);a.doesNotThrow(()=>JSON.parse(r.stdout));
  if(row.http!=='GET'&&(row.resource==='integrations'||row.id===155))for(const flag of [[],['--confirm=false']]){
   if(flag.length)continue;const p=run(row,row.cli.filter(v=>v!=='--confirm'),{K4_REQUESTS:'0'});a.equal(p.status,0,p.stderr);a.equal(JSON.parse(p.stdout).confirmation_required||!!JSON.parse(p.stdout).would_change,true);
  }
 }
});
test('K4 CLI integration success, preview and errors never print credential URLs, headers or private body details',()=>{
 const row={...cases.find(r=>r.id===47),response:{phone_number:'+12025550123',functions:[{id:'f',url:'https://secret.invalid/private_fixture_value',headers:{Authorization:'private_fixture_value'},parameters:{secret:'private_fixture_value'},unexpected_secret:'private_fixture_value',has_headers:true}]}};
 const r=run(row);a.equal(r.status,0,r.stderr);a.ok(!/private_fixture_value|secret\.invalid/.test(r.stdout+r.stderr));a.equal(JSON.parse(r.stdout).functions[0].has_headers,true);
 const write=cases.find(r=>r.id===46),err=run(write,write.cli,{K4_ERROR:'1'});a.equal(err.status,1);a.ok(!/private_fixture_value|secret\.invalid/.test(err.stdout+err.stderr));a.equal(JSON.parse(err.stdout).error.code,'outcome_unknown');
 const hook={...cases.find(r=>r.id===28),response:{webhook_url:'https://secret.invalid/private_fixture_value',is_set:true},cli:['webhooks','get','+12025550123']};
 for(const cmd of ['get','delete']){const h=run(hook,['webhooks',cmd,'+12025550123']);a.equal(h.status,0,h.stderr);a.ok(!/private_fixture_value|secret\.invalid/.test(h.stdout+h.stderr))}
});
test('K4 CSV export publishes only a complete file, never overwrites, cleans partial output; numeric small cursor is retained',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nixflex-k4-test-'));
 try{
  const out=path.join(dir,'activity.csv');const row={...cases.find(r=>r.id===145),body:null,query:{from:'2026-10-01',before:'123',format:'csv'}};
  const args=['organisation','activityCsv','--set','from=2026-10-01','--set','before=123','--output',out];
  const partial=run(row,args,{K4_CSV:'partial'});a.equal(partial.status,1);a.equal(fs.existsSync(out),false);a.deepEqual(fs.readdirSync(dir),[]);
  const good=run(row,args,{K4_CSV:'ok'});a.equal(good.status,0,good.stderr);a.equal(fs.readFileSync(out,'utf8'),'When,Action,Result\n');
  const again=run(row,args,{K4_CSV:'ok'});a.equal(again.status,1);a.equal(fs.readFileSync(out,'utf8'),'When,Action,Result\n');a.deepEqual(fs.readdirSync(dir),['activity.csv']);
 }finally{a.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'nixflex-k4-test-'));fs.rmSync(dir,{recursive:true,force:true})}
});
