const {test}=require('node:test'),a=require('node:assert/strict'),{Nixflex}=require('../dist/index.cjs');
test('organisation SDK uses fixed scoped paths; personal owner operations are not exposed',async()=>{
 const old=global.fetch,seen=[];global.fetch=async(url,init)=>{seen.push({url:new URL(url),init});return new Response('{}',{headers:{'content-type':'application/json'}})};
 try{const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://offline.example.test',maxRetries:0});
 await c.organisation.get();await c.organisation.members();await c.organisation.activity({before:'18',actor:'person'});
 await c.organisation.invite('person@example.test','member');await c.organisation.resend('id/a');await c.organisation.revoke('id/a');
 await c.organisation.removeMember('id/a');await c.organisation.setRole('person','admin');await c.organisation.claimInvite('owner@example.test');
 a.equal(seen.length,9);a.ok(seen.every(x=>x.url.pathname.startsWith('/v1/organisation')));a.match(seen[4].url.pathname,/id%2Fa\/resend$/);
 a.deepEqual(JSON.parse(seen[3].init.body),{email:'person@example.test',role:'member'});a.equal(seen[2].url.searchParams.get('before'),'18');
 for(const x of ['accept','leave','transfer','delete'])a.equal(c.organisation[x],undefined);
 }finally{global.fetch=old}
});
test('organisation CLI previews every mutation without contacting any provider',()=>{
 const {execFileSync}=require('node:child_process'),cli=__dirname+'/../dist/cli/index.js';
 for(const command of ['invite','claim','resend','revoke','remove','role']){
 const output=execFileSync(process.execPath,[cli,'organisation',command,'fixture','--key','nxf_offline:nxfs_offline','--json','--base-url','https://never-contact.invalid'],{encoding:'utf8'});
 a.match(output,/would_change/);a.match(output,/--confirm/);
 }
});
test('all nine organisation SDK methods have visible CLI help commands',()=>{
 const fs=require('node:fs'),{execFileSync}=require('node:child_process');
 const source=fs.readFileSync(__dirname+'/../src/resources/organisation.ts','utf8');
 const methods=[...source.matchAll(/^  ([a-zA-Z]+)\(/gm)].map(m=>m[1]).filter(n=>n!=='constructor');
 const mapping={get:'get',members:'members',invite:'invite',resend:'resend',revoke:'revoke',removeMember:'remove',setRole:'role',activity:'activity',claimInvite:'claim',rename:'rename',activityCsv:'activityCsv'};
 a.deepEqual(methods.sort(),Object.keys(mapping).sort());
 const help=execFileSync(process.execPath,[__dirname+'/../dist/cli/index.js','--help'],{encoding:'utf8'});
 for(const method of methods)a.match(help,new RegExp('organisation '+mapping[method]+'(?:\\s|$)'),method);
});
