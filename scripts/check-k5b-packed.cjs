const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..'),latest=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const work=path.join(root,'.artifacts','k5b-install-'+randomUUID());fs.mkdirSync(work,{recursive:true});
function run(args,cwd,env=process.env){const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout}
const npmCli=process.argv[2];a.ok(npmCli);
fs.writeFileSync(path.join(work,'package.json'),JSON.stringify({private:true,name:'k5b-artifact-check',version:'1.0.0',type:'module'}));
run([npmCli,'install','--offline','--ignore-scripts','--no-audit','--no-fund',latest.tarball],work);
const installed=path.join(work,'node_modules/nixflex'),types=path.join(work,'types.mts');
fs.writeFileSync(types,fs.readFileSync(path.join(root,'tests/k5b-keyterms-types.ts'),'utf8').replace('../dist/index.js','./node_modules/nixflex/dist/index.js'));
run([require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',types],work);
const env={...process.env,K5_PACKED_SDK:path.join(installed,'dist/index.cjs'),K5_PACKED_CLI:path.join(installed,'dist/cli/index.js')};
process.stdout.write(run(['--test','tests/k5b.test.cjs','tests/k5-knowledge.test.cjs','tests/k5-transfer.test.cjs','tests/k5-cli.test.cjs'],root,env));
fs.writeFileSync(path.join(root,'.artifacts/k5b-latest.json'),JSON.stringify({tarball:latest.tarball,installed,cli:env.K5_PACKED_CLI,types,checks:'fresh offline install; packed types; exact caller errors; K5 wire/stream/CLI regressions'},null,2)+'\n');
console.log('PASS K5b installed artifact: six-field types, caller error mapping and prior Knowledge regressions');
