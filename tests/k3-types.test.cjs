const {test}=require('node:test'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('K3 declarations preserve nullable estimates/appearance, JSON variables and exact revision strings',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k3-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
