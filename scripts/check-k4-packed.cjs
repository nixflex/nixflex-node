const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),a=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'.artifacts/latest.json')));
const directory=path.join(path.dirname(meta.tarball),'package');
const env={...process.env,K4_PACKED_SDK:path.join(directory,'dist/index.cjs'),K4_PACKED_CLI:path.join(directory,'dist/cli/index.js')};
a.ok(fs.existsSync(env.K4_PACKED_SDK));a.ok(fs.existsSync(env.K4_PACKED_CLI));
const result=spawnSync(process.execPath,['--test','tests/k4-integrations.test.cjs','tests/k4-stream.test.cjs','tests/k4-cli.test.cjs'],{cwd:root,env,encoding:'utf8',timeout:180000,windowsHide:true});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exitCode=result.status??1;
