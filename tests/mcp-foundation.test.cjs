const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const stage='https://nixflex-voice-engine-staging.up.railway.app',sentinel='nxf_sentinel:nxfs_sentinel';
const modules=async()=>({...(await import('../src/cli/mcp/config-write.mjs')),...(await import('../src/cli/mcp/config-edit.mjs')),...(await import('../src/cli/mcp/launch.mjs'))});
const scratch=()=>fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'nxf-config-')));
test('MCP safe writer preserves other servers/comments and is idempotent, private and secret-free',async()=>{
 const {writeMcpConfig,buildServerConfig}=await modules(),root=scratch(),file=path.join(root,'mcp.json');
 const raw='{\n // Keep this comment\n "mcpServers": {"other":{"command":"other"}}\n}\n';fs.writeFileSync(file,raw);
 const entry=buildServerConfig({client:'cursor',platform:process.platform,version:'0.3.1',baseUrl:stage,key:sentinel});
 const previews=[];
 const params={file,name:'nixflex-staging',entry,confirm:()=>a.fail('new entry needs no replacement approval'),display:p=>previews.push(p)};
 a.equal((await writeMcpConfig(params)).changed,true);
 const text=fs.readFileSync(file,'utf8');a.ok(text.includes('// Keep this comment'));a.ok(text.includes('"other":{"command":"other"}'));
 a.ok(!JSON.stringify(previews).includes(sentinel));a.ok(!text.includes(sentinel));
 a.equal((await writeMcpConfig(params)).changed,false);
 a.deepEqual(fs.readdirSync(root),['mcp.json']);
 if(process.platform!=='win32')a.equal(fs.statSync(file).mode&0o777,0o600);
 else {const r=spawnSync('icacls.exe',[file],{encoding:'utf8'});a.equal(r.status,0);a.ok(!r.stdout.includes('(I)'));}
});
test('MCP replacement is explicitly confirmed and old values never enter the preview',async()=>{
 const {writeMcpConfig}=await modules(),root=scratch(),file=path.join(root,'mcp.json');
 const original=JSON.stringify({mcpServers:{nixflex:{command:sentinel,args:[sentinel],env:{NIXFLEX_API_KEY:sentinel}}}});
 fs.writeFileSync(file,original);let preview;
 const params={file,name:'nixflex',entry:{command:'node',args:['safe']},display:p=>preview=p,confirm:()=>false};
 await a.rejects(writeMcpConfig(params),/not confirmed/);a.equal(fs.readFileSync(file,'utf8'),original);
 a.ok(!JSON.stringify(preview).includes(sentinel));
 await writeMcpConfig({...params,confirm:()=>true});a.ok(!fs.readFileSync(file,'utf8').includes(sentinel));
});
test('MCP corrupt, duplicate, unreadable and non-regular config refuse without overwriting',async()=>{
 const {writeMcpConfig}=await modules();
 for(const raw of ['{ bad '+sentinel,'{"mcpServers":[],"mcpServers":{}}','{"mcpServers":[]}','null']) {
  const file=path.join(scratch(),'mcp.json');fs.writeFileSync(file,raw);
  await a.rejects(writeMcpConfig({file,name:'nixflex',entry:{command:'node'},confirm:()=>true}));a.equal(fs.readFileSync(file,'utf8'),raw);
 }
 const file=path.join(scratch(),'mcp.json');fs.mkdirSync(file);
 await a.rejects(writeMcpConfig({file,name:'nixflex',entry:{command:'node'},confirm:()=>true}),/safely read/);
});
test('MCP concurrent modification and another installer lock both refuse',async()=>{
 const {writeMcpConfig}=await modules(),file=path.join(scratch(),'mcp.json');fs.writeFileSync(file,'{}');
 const params={file,name:'nixflex',entry:{command:'node'},confirm:()=>true};
 await a.rejects(writeMcpConfig({...params,beforeCommit:()=>fs.writeFileSync(file,'{"ownerEdit":true}')}),/changed during/);
 a.equal(fs.readFileSync(file,'utf8'),'{'+'"ownerEdit":true}');
 fs.writeFileSync(file+'.nixflex-setup.lock','');
 await a.rejects(writeMcpConfig(params),/Another setup/);a.ok(fs.existsSync(file+'.nixflex-setup.lock'));
});
test('MCP commented replacement and read-only files are refused with bytes intact',async()=>{
 const {writeMcpConfig}=await modules(),file=path.join(scratch(),'mcp.json');
 const text='{"mcpServers":{"nixflex":{/* owner note */ "command":"old"}}}';fs.writeFileSync(file,text);
 await a.rejects(writeMcpConfig({file,name:'nixflex',entry:{command:'new'},confirm:()=>true}),/comments/);
 a.equal(fs.readFileSync(file,'utf8'),text);
 fs.chmodSync(file,0o444);
 try {await a.rejects(writeMcpConfig({file,name:'nixflex',entry:{command:'new'},confirm:()=>true}),/safely read/);}
 finally{fs.chmodSync(file,0o600);}
 a.equal(fs.readFileSync(file,'utf8'),text);
});
test('Claude strict JSON never accepts a comment/trailing-comma file as valid',async()=>{
 const {writeMcpConfig}=await modules();
 for(const text of ['{/* comment */}', '{"mcpServers":{},}']) {
  const file=path.join(scratch(),'claude.json');fs.writeFileSync(file,text);
  await a.rejects(writeMcpConfig({file,name:'nixflex',entry:{command:'node'},format:'json',confirm:()=>true}),/strict JSON/);
  a.equal(fs.readFileSync(file,'utf8'),text);
 }
});
test('MCP shared builders cover all four clients without OS-vault or VS Code setup',async()=>{
 const {buildServerConfig,configSnippet}=await import('../src/cli/mcp/launch.mjs');
 const {resolveConnection}=await import('../src/cli/mcp/connection.mjs');
 const release=require('../src/cli/mcp/release.json');
 for(const client of ['claude','claude-code','codex','cursor'])for(const platform of ['win32','darwin']) {
  const config=buildServerConfig({client,platform,version:release.mcpVersion,baseUrl:stage,key:sentinel});
  a.equal(config.command,platform==='win32'?'cmd.exe':'npx');a.ok(!JSON.stringify(config).includes(sentinel));
  a.ok(configSnippet({client,platform,version:release.mcpVersion,baseUrl:stage}).includes(stage));
 }
 a.throws(()=>resolveConnection({env:{NIXFLEX_API_KEY:sentinel}}),/required/);
 a.throws(()=>buildServerConfig({client:'vscode'}),/retired/);
});
