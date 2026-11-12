const {test}=require('node:test'),a=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
test('K9 actual deletion methods require complete B57 receipts while the old SMS type remains source-compatible',()=>{
 const r=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--noEmit','--skipLibCheck','--target','es2022','--moduleResolution','node','tests/k9-types.ts'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 a.equal(r.status,0,r.stdout+r.stderr);
});
