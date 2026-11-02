const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const dir=path.join(path.dirname(meta.tarball),'package');
fs.mkdirSync(path.join(dir,'tests'),{recursive:true});
for(const f of ['k2-core.test.cjs','k2-cli.test.cjs'])fs.copyFileSync(path.join(root,'tests',f),path.join(dir,'tests',f));
execFileSync(process.execPath,['--test','tests/k2-core.test.cjs','tests/k2-cli.test.cjs'],{cwd:dir,stdio:'inherit',windowsHide:true});
console.log('PASS K2 actual tarball SDK + CLI; no src imports');
