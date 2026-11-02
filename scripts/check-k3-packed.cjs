const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const work=path.dirname(meta.tarball),packed=path.join(work,'package');
const extract=spawnSync('tar',['-xf',meta.tarball,'-C',work],{windowsHide:true,encoding:'utf8'});a.equal(extract.status,0);
const env={};for(const k of Object.keys(process.env))if(/^(path|systemroot|windir|comspec|temp|tmp)$/i.test(k))env[k]=process.env[k];
const result=spawnSync(process.execPath,['--test','tests/k3-c5.test.cjs','tests/k3-cli.test.cjs'],{cwd:root,windowsHide:true,encoding:'utf8',
 env:{...env,K3_PACKED_SDK:path.join(packed,'dist/index.cjs'),K3_PACKED_CLI:path.join(packed,'dist/cli/index.js')},timeout:180000});
process.stdout.write(result.stdout);process.stderr.write(result.stderr);a.equal(result.status,0);
console.log('PASS K3 packed Node SDK + CLI: all 27 operations, every new confirmation gate and one-attempt writes');
