const {test}=require('node:test'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('K2 declarations cover nullable core fields and complete catalog queries',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k2-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
