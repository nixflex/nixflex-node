const {test}=require('node:test');
const a=require('node:assert/strict');
const http=require('node:http');
const {spawn}=require('node:child_process');
const path=require('node:path');
function cli(args,url){return new Promise((resolve,reject)=>{
 const env={};for(const k of ['PATH','Path','SystemRoot','SYSTEMROOT','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
 Object.assign(env,{NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture',HOME:__dirname,USERPROFILE:__dirname});
 const child=spawn(process.execPath,[path.resolve(__dirname,'../dist/cli/index.js'),...args,'--base-url',url,'--json'],{env});
 let out='',err='';const timer=setTimeout(()=>{child.kill();reject(Error('CLI timeout'));},10000);
 child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);
 child.on('exit',code=>{clearTimeout(timer);resolve({code,out,err});});
});}
test('CLI delete lost reply: one request, parseable unknown error, no success',async()=>{
 let hits=0;const s=http.createServer(req=>{hits++;req.socket.destroy();});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));
 try{const r=await cli(['numbers','delete','+12025550100','--confirm'],'http://127.0.0.1:'+s.address().port);
  a.equal(hits,1);a.equal(r.code,1);const e=JSON.parse(r.out).error;
  a.equal(e.outcome,'unknown');a.equal(e.safe_to_retry,false);a.match(e.message,/check before retrying/);
 }finally{await new Promise(r=>s.close(r));}
});
test('CLI numbers list still succeeds against a local fake API',async()=>{
 let hits=0;const s=http.createServer((req,res)=>{hits++;a.equal(req.method,'GET');a.equal(req.url,'/v1/phone-numbers');
  res.setHeader('content-type','application/json');res.end(JSON.stringify({phone_numbers:[],count:0}));});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));
 try{const r=await cli(['numbers','list'],'http://127.0.0.1:'+s.address().port);
  a.equal(r.code,0,r.err);a.deepEqual(JSON.parse(r.out),{phone_numbers:[],count:0});a.equal(hits,1);
 }finally{await new Promise(r=>s.close(r));}
});
