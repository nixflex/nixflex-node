const {test}=require('node:test'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('K4 declarations match projected activity, private credential flags and typed integration inputs',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k4-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
