const { test } = require('node:test');
const a = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { Nixflex } = require('../dist/index.cjs');

test('call iterator spans >200, exact full final page, empty and page-size boundaries', async () => {
  const original = global.fetch;
  try {
    for (const [count, size, offsets] of [[451,200,[0,200,400]], [400,200,[0,200,400]], [0,200,[0]], [3,1,[0,1,2,3]], [100,100,[0,100]]]) {
      const seen = [], rows = Array.from({length:count}, (_, i) => ({call_id:String(i)}));
      global.fetch = async input => {
        const url = new URL(input); a.equal(url.origin, 'https://offline.invalid');
        a.equal(url.pathname, '/v1/calls');
        const offset = Number(url.searchParams.get('offset')), limit = Number(url.searchParams.get('limit'));
        seen.push(offset); a.equal(limit, size);
        return Response.json(rows.slice(offset, offset + Math.min(limit, 200)));
      };
      const result = [];
      for await (const call of new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://offline.invalid'}).calls.iter(size)) result.push(call);
      a.deepEqual(result, rows); a.deepEqual(seen, offsets);
    }
  } finally { global.fetch = original; }
});

test('invalid call page sizes fail before any request; options reach every page', async () => {
  const original = global.fetch; let hits = 0;
  global.fetch = async () => { hits++; return Response.json([]); };
  try {
    const c = new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://offline.invalid'});
    for (const size of [0,-1,201,500,1.5,NaN,Infinity,'100',null]) {
      await a.rejects(async () => { for await (const item of c.calls.iter(size)) void item; }, RangeError);
    }
    a.equal(hits, 0);
    const ctrl = new AbortController(); ctrl.abort();
    global.fetch = async (_, opts) => { hits++; a.equal(opts.signal.aborted, true); throw new DOMException('Stopped', 'AbortError'); };
    await a.rejects(async () => { for await (const item of c.calls.iter(100,{signal:ctrl.signal})) void item; });
  } finally { global.fetch = original; }
});

test('Node canonical variables are passed unchanged, including empty values', async () => {
  const original = global.fetch; const seen = [];
  global.fetch = async (url, opts) => { a.equal(url,'https://offline.invalid/v1/calls/outbound'); seen.push(JSON.parse(opts.body)); return Response.json({call_id:'fixture'}); };
  try {
    const c = new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://offline.invalid'});
    const base = {agent_id:'a',to_number:'+12025550100',prompt:'Hi {{name}}'};
    for (const extra of [{},{dynamic_vars:{}},{dynamic_vars:{name:'Sam',blank:'',zero:'0'}}]) {
      await c.calls.create({...base,...extra}); a.deepEqual(seen.at(-1),{...base,...extra});
    }
  } finally { global.fetch = original; }
});

test('real CLI exact wire body for --var, --set and aliases; conflicts make zero requests', async () => {
  const seen = [];
  const server = http.createServer((req,res) => {
    let body=''; req.on('data',part=>body+=part); req.on('end',()=>{
      a.equal(req.method,'POST'); a.equal(req.url,'/v1/calls/outbound'); seen.push(JSON.parse(body));
      res.writeHead(201,{'content-type':'application/json'}); res.end('{"call_id":"fixture"}');
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const env={}; for(const k of ['PATH','Path','SystemRoot','TEMP','TMP']) if(process.env[k]) env[k]=process.env[k];
  const base={agent_id:'a',to_number:'+12025550100',prompt:'Hello {{name}}'};
  async function cli(flags) { return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['dist/cli/index.js','calls','create','--json','--base-url',
      'http://127.0.0.1:'+server.address().port,'--agent','a','--to',base.to_number,'--prompt',base.prompt,...flags],
      {env:{...env,NIXFLEX_API_KEY:'nxf_fixture:nxfs_fixture'},windowsHide:true});
    let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
    const timer=setTimeout(()=>{child.kill();reject(Error('CLI fixture timed out'));},10000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);resolve({code,out,err});});
  }); }
  try {
    for (const [flags,extra] of [
      [[],{}], [['--var','name=Sam','--var','blank=','--var','text=a=b'],{dynamic_vars:{name:'Sam',blank:'',text:'a=b'}}],
      [['--set','dynamic_vars={"name":"Sam"}'],{dynamic_vars:{name:'Sam'}}],
      [['--body','{"variables":{"name":"Sam"},"campaign_id":"fixture"}'],{dynamic_vars:{name:'Sam'},campaign_id:'fixture'}],
      [['--set','variables={}'],{dynamic_vars:{}}],
    ]) {
      const result=await cli(flags);a.equal(result.code,0,result.err);a.deepEqual(seen.at(-1),{...base,...extra});
      a.equal(JSON.parse(result.out).call_id,'fixture');
    }
    const before=seen.length;
    for(const flags of [
      ['--var','name=Sam','--set','dynamic_vars={"name":"Other"}'],
      ['--set','variables={}','--set','dynamic_vars={}'],
      ['--var','name=Sam','--set','variables={}'],
    ]) { const result=await cli(flags);a.notEqual(result.code,0);a.match(result.err,/Use only one/); }
    a.equal(seen.length,before);
  } finally { await new Promise(r=>server.close(r)); }
});
