import { chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
export function restrictFile(file) {
  if (process.platform !== 'win32') { chmodSync(file, 0o600); return; }
  const user = spawnSync('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true });
  const sid = user.status === 0 && user.stdout.match(/S-1-5-(?:\d+-)*\d+/)?.[0];
  if (!sid) throw new Error('Cannot determine private configuration permissions. Nothing replaced.');
  const result = spawnSync('icacls.exe', [file, '/inheritance:r', '/grant:r', '*' + sid + ':(F)', '*S-1-5-18:(F)'],
    { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Cannot protect private configuration. Nothing replaced.');
}
