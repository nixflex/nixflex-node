const {test}=require('node:test'),a=require('node:assert/strict');
const {spawnSync}=require('node:child_process');const {pathToFileURL}=require('node:url');const path=require('node:path');
const rows=require('./fixtures/c5-cases.json');
const cli=process.env.K3_PACKED_CLI||path.join(__dirname,'../dist/cli/index.js');
function run(row,args){
 const env={};for(const k of Object.keys(process.env))if(/^(path|systemroot|windir|comspec|temp|tmp)$/i.test(k))env[k]=process.env[k];
 return spawnSync(process.execPath,['--import',pathToFileURL(path.join(__dirname,'fixtures/c5-fetch.mjs')).href,cli,...args,'--json','--base-url','https://fixture.invalid'],
  {env:{...env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',K3_CASE:String(row.id),HOME:__dirname,USERPROFILE:__dirname},encoding:'utf8',windowsHide:true,timeout:20000});
}
test('K3 built CLI covers all 27 operations with exact query parsing, body and nested path',()=>{
 for(const row of rows){const r=run(row,row.cli);a.equal(r.status,0,'operation '+row.id+': '+r.stderr);a.deepEqual(JSON.parse(r.stdout),row.response);a.match(r.stderr,/K3_FAKE_REQUESTS=1/)}
});
test('K3 every new CLI write previews with zero requests until explicitly confirmed',()=>{
 for(const row of rows.filter(r=>[91,92,94,99,101,179,180,181,183,54,59].includes(r.id))){
  const r=run(row,row.cli.filter(v=>v!=='--confirm'));a.equal(r.status,0);a.equal(JSON.parse(r.stdout).confirmation_required,true);a.match(r.stderr,/K3_FAKE_REQUESTS=0/);
 }
});
