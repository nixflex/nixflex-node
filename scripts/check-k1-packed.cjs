const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const directory=path.join(path.dirname(meta.tarball),'package');
const {Nixflex,SDK_VERSION}=require(path.join(directory,'dist/index.cjs'));
a.equal(SDK_VERSION,meta.version);
const seen=[];global.fetch=async(u,o)=>{seen.push([u,o]);return Response.json({ok:true})};
(async()=>{
 const c=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid',maxRetries:0});
 const wire=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/k1-wire.json')));
 await c.sms.campaigns.create(wire.campaign);a.deepEqual(JSON.parse(seen[0][1].body),wire.campaign);
 await c.agents.create({});a.deepEqual(JSON.parse(seen[1][1].body),{});
 a.equal(c.calls.billing,undefined);for(const key of ['storage','llm','tts'])a.equal(c[key],undefined);
 a.equal(c.phoneNumbers.setMonitor,undefined);a.equal(c.phoneNumbers.getMonitor,undefined);
 a.equal(seen[0][1].headers['User-Agent'],'nixflex-node/'+meta.version);
 const result=execFileSync(process.execPath,[path.join(directory,'dist/cli/index.js'),'--version'],{windowsHide:true,encoding:'utf8'}).trim();a.equal(result,meta.version);
 console.log('PASS packed Node SDK/CLI '+meta.version+'; canonical wire, defaults, scope, User-Agent');
})().catch(()=>{console.error('FAIL packed K1 contract');process.exitCode=1});
