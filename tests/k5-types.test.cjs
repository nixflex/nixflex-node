const {test}=require('node:test'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('K5 declarations preserve revision numbers, terminal review alternatives and streamed bytes without private provider exports',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k5-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
