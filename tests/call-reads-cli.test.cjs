const {test}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{spawn}=require('node:child_process');
const path=require('node:path');
test('real CLI call history/read/recording/billing make only escaped GETs to loopback',async()=>{
 const seen=[],server=http.createServer((req,res)=>{seen.push({method:req.method,url:req.url});res.writeHead(200,{'content-type':'application/json'});res.end('{"data":[],"totals":{"total":0},"status":"unknown"}');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=args=>new Promise((resolve,reject)=>{
  const env={};for(const k of ['PATH','Path','SystemRoot','ComSpec','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
  env.NIXFLEX_API_KEY='nxf_fixture:nxfs_fixture';
  const child=spawn(process.execPath,[path.resolve(__dirname,'../dist/cli/index.js'),'calls',...args,'--base-url','http://127.0.0.1:'+server.address().port,'--json'],{env,windowsHide:true});
  let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',c=>{if(c)reject(Error(err));else resolve(JSON.parse(out));});
 });
 try{
  await run(['history','--number','+12025550100','--outcome','failed','--period','month','--limit','2']);
  const u=new URL(seen[0].url,'http://localhost');a.equal(u.pathname,'/v1/calls/history');a.equal(u.searchParams.get('number'),'+12025550100');a.equal(u.searchParams.get('outcome'),'failed');
  for(const c of ['read','recording','billing'])await run([c,'failed:id/a']);
  a.match(seen[1].url,/failed%3Aid%2Fa\?view=detail$/);a.match(seen[2].url,/\/recording$/);a.match(seen[3].url,/\/billing$/);a.ok(seen.every(x=>x.method==='GET'));
 }finally{await new Promise(r=>server.close(r));}
});
