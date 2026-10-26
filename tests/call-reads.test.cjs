const {test}=require('node:test');
const a=require('node:assert/strict');
const {Nixflex}=require('../dist/index.cjs');
test('call reads preserve legacy array and forward every filter; explicit detail/recording/billing are GET-only',async()=>{
 const old=global.fetch,seen=[];
 global.fetch=async(url,init)=>{seen.push({url:new URL(url),init});return new Response(JSON.stringify(url.includes('/history')?{data:[],totals:{total:0},has_more:false,next_cursor:null}:[]),{headers:{'content-type':'application/json'}});};
 try{
  const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://read.example.test',maxRetries:0});
  a.deepEqual(await c.calls.list(),[]);
  const p={number:'+12025550100',agent:'agent',direction:'web',source:'test',outcome:'unknown',period:'all',search:'literal%_',since:'2026-01-01T00:00:00Z',until:'2026-10-26T00:00:00Z',limit:2,offset:0};
  await c.calls.history(p);for(const[k,v]of Object.entries(p))a.equal(seen[1].url.searchParams.get(k),String(v));
  await c.calls.history({cursor:'next-token',limit:2});
  for(const method of ['read','recording','billing'])await c.calls[method]('failed:id/a');
  a.equal(seen[3].url.searchParams.get('view'),'detail');a.match(seen[4].url.pathname,/failed%3Aid%2Fa\/recording$/);
  a.match(seen[5].url.pathname,/\/billing$/);a.ok(seen.every(x=>x.init.method==='GET'&&!x.init.body));
 }finally{global.fetch=old;}
});
