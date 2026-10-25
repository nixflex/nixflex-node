const {test}=require('node:test');
const a=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
test('Numbers PATCH and optional provider declarations compile accurately',()=>{
 const r=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','tests/number-types.ts'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
 a.equal(r.status,0,r.stdout+r.stderr);
});
