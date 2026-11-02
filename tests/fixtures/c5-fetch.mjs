import a from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('./c5-cases.json',import.meta.url)));
const row=rows.find(r=>r.id===Number(process.env.K3_CASE));
let count=0;
globalThis.fetch=async(url,init)=>{
 count++;const u=new URL(url);a.equal(u.origin,'https://fixture.invalid');a.equal(u.pathname,row.path);
 a.equal(init.method,row.http);a.equal(init.redirect,'error');
 a.deepEqual(init.body?JSON.parse(init.body):null,row.body);
 a.deepEqual(Object.fromEntries(u.searchParams),Object.fromEntries(Object.entries(row.query).map(([k,v])=>[k,String(v)])));
 return Response.json(row.response);
};
process.on('exit',()=>process.stderr.write('K3_FAKE_REQUESTS='+count+'\n'));
