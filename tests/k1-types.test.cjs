const {test}=require('node:test'),{execFileSync}=require('node:child_process'),path=require('node:path');
test('K1 declarations require SMS sender and expose real envelopes, counts and optional capacity',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/k1-types.ts'],{cwd:path.resolve(__dirname,'..'),windowsHide:true});
});
