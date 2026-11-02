const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..'),latest=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const work=path.join(root,'.artifacts','k5-install-'+randomUUID());fs.mkdirSync(work,{recursive:true});
function run(args,cwd,env=process.env){const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout}
const npmCli=process.env.npm_execpath||process.argv[2];a.ok(npmCli);
fs.writeFileSync(path.join(work,'package.json'),JSON.stringify({private:true,name:'k5-artifact-check',version:'1.0.0'}));
run([npmCli,'install','--offline','--ignore-scripts','--no-audit','--no-fund',latest.tarball],work);
const installed=path.join(work,'node_modules/nixflex');
for(const file of ['KNOWLEDGE.md','METHODS.md','TEAM-INTEGRATIONS.md'])a.ok(fs.existsSync(path.join(installed,file)));
const env={...process.env,K5_PACKED_SDK:path.join(installed,'dist/index.cjs'),K5_PACKED_CLI:path.join(installed,'dist/cli/index.js')};
const result=run(['--test','tests/k5-knowledge.test.cjs','tests/k5-transfer.test.cjs','tests/k5-cli.test.cjs'],root,env);
process.stdout.write(result);
fs.writeFileSync(path.join(work,'evidence.json'),JSON.stringify({tarball:latest.tarball,installed,checks:'clean npm install; exact 40 wires, all CLI confirmations, stream/uncertainty/partial-file tests'},null,2)+'\n');
process.stdout.write('PASS K5 clean installed npm artifact\n');
