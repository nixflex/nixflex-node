const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const stage='https://nixflex-voice-engine-staging.up.railway.app',key='nxf_setupfixture:nxfs_setupfixture';
const binary=path.join(__dirname,'..','dist','cli','index.js');
function fixture(){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'nxf-cli-'))),pkg=path.join(root,'local package');fs.mkdirSync(pkg);
 fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:'nixflex-mcp',version:require('../src/cli/mcp/release.json').mcpVersion,bin:{'nixflex-mcp':'./index.js'}}));
 fs.writeFileSync(path.join(pkg,'index.js'),'// fixture only, never executed');
 const env={};for(const [k,v]of Object.entries(process.env))if(/^(path|systemroot|windir|temp|tmp)$/i.test(k))env[k]=v;
 Object.assign(env,{HOME:root,USERPROFILE:root,APPDATA:root,NIXFLEX_API_KEY:key,NIXFLEX_BASE_URL:stage});
 return {root,pkg,env,run:args=>spawnSync(process.execPath,[binary,...args],{env,encoding:'utf8'})};
}
test('built CLI setup uses local package safely and never serializes the environment key',()=>{
 const f=fixture(),result=f.run(['mcp','setup','cursor','--mcp-local',f.pkg,'--json']);
 a.equal(result.status,0,result.stderr);a.ok(!(result.stdout+result.stderr).includes(key));
 const config=fs.readFileSync(path.join(f.root,'.cursor','mcp.json'),'utf8');a.ok(!config.includes(key));
 const entry=JSON.parse(config).mcpServers['nixflex-staging'];a.equal(entry.command,process.execPath);
 a.deepEqual(entry.args,[path.join(f.pkg,'index.js')]);a.equal(entry.env.NIXFLEX_BASE_URL,stage);
 a.equal(entry.env.NIXFLEX_API_KEY,'${env:NIXFLEX_API_KEY}');
 a.equal(f.run(['mcp','setup','cursor','--mcp-local',f.pkg,'--json']).status,0);
});
test('built CLI refuses unpublished npm target, VS Code and missing base without changing config',()=>{
 for(const args of [['mcp','setup','cursor'],['mcp','setup','vscode']]){
  const f=fixture(),source=fs.readFileSync(binary,'utf8');
  const approved='mcpVersion: "0.5.0", minimumNodeMajor: 22, published: true';
  a.equal(source.split(approved).length,2,'exactly one compiled release gate');
  const unpublished=path.join(f.root,'unpublished.mjs');
  fs.writeFileSync(unpublished,source.replace(approved,approved.replace('true','false')));
  const result=spawnSync(process.execPath,[unpublished,...args],{env:f.env,encoding:'utf8'});
  a.notEqual(result.status,0);a.ok(!fs.existsSync(path.join(f.root,'.cursor','mcp.json')));
  if(args[2]==='cursor')a.match(result.stderr,/not published yet/);
  a.ok(!(result.stdout+result.stderr).includes(key));
 }
 const f=fixture();delete f.env.NIXFLEX_BASE_URL;
 a.notEqual(f.run(['mcp','setup','cursor','--mcp-local',f.pkg]).status,0);
 a.ok(!fs.existsSync(path.join(f.root,'.cursor','mcp.json')));
});
test('K5 published CLI writes a pinned MCP launcher without launching or serializing the key',()=>{
 const f=fixture(),result=f.run(['mcp','setup','cursor','--json']);
 a.equal(require('../src/cli/mcp/release.json').published,true);
 a.equal(result.status,0,result.stderr);a.ok(!(result.stdout+result.stderr).includes(key));
 const raw=fs.readFileSync(path.join(f.root,'.cursor','mcp.json'),'utf8');a.ok(!raw.includes(key));
 const entry=JSON.parse(raw).mcpServers['nixflex-staging'];
 a.equal(entry.env.NIXFLEX_BASE_URL,stage);a.equal(entry.env.NIXFLEX_API_KEY,'${env:NIXFLEX_API_KEY}');
 a.ok(entry.args.join(' ').includes('nixflex-mcp@0.5.0'));
 a.ok(!fs.existsSync(path.join(f.root,'node_modules')),'setup only writes config');
 const bad=fixture();a.notEqual(bad.run(['mcp','setup','vscode']).status,0);
 a.ok(!fs.existsSync(path.join(bad.root,'.cursor','mcp.json')));
});
