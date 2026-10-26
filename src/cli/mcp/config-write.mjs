import { readFileSync, lstatSync, mkdirSync, openSync, closeSync, writeFileSync, fsyncSync, renameSync, unlinkSync, linkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { planConfigEdit } from './config-edit.mjs';
import { restrictFile } from './private-file.mjs';

function snapshot(file) {
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('Not a regular private file');
    if (!(stat.mode & 0o200)) throw new Error('File is read-only');
    const text = readFileSync(file, 'utf8');
    return { text, stamp: [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs, stat.mode].join(':') };
  } catch (error) {
    if (error.code === 'ENOENT') return { text: null, stamp: null };
    throw new Error('Cannot safely read MCP configuration; nothing changed.');
  }
}
export async function writeMcpConfig({ file, name, entry, format = 'jsonc', confirm, display = () => {}, beforeCommit = () => {} }) {
  // Never traverse a linked config directory into an unexpected destination.
  for (let parent = dirname(file); ; parent = dirname(parent)) {
    try { if (lstatSync(parent).isSymbolicLink()) throw new Error('Linked configuration directory is not supported; nothing changed.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (parent === dirname(parent)) break;
  }
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const lock = file + '.nixflex-setup.lock';
  let lockFd;
  try { lockFd = openSync(lock, 'wx', 0o600); }
  catch { throw new Error('Another setup may be running. Configuration was not changed.'); }
  const temporary = join(dirname(file), '.nixflex-' + randomUUID() + '.tmp');
  let tempFd;
  try {
    restrictFile(lock);
    const original = snapshot(file);
    const planned = planConfigEdit(original.text ?? '{}\n', name, entry, format);
    if (!planned.changed) return { changed: false };
    display(planned.preview);
    if (planned.replacing && !await confirm()) throw new Error('Replacement not confirmed; nothing changed.');
    tempFd = openSync(temporary, 'wx', 0o600);
    restrictFile(temporary); // Protect the empty file BEFORE copying existing settings into it.
    writeFileSync(tempFd, planned.text, 'utf8'); fsyncSync(tempFd); closeSync(tempFd); tempFd = undefined;
    await beforeCommit();
    const current = snapshot(file);
    if (current.stamp !== original.stamp || current.text !== original.text)
      throw new Error('MCP configuration changed during setup. Nothing replaced; review and retry.');
    // Atomic no-clobber creation; existing files use same-directory atomic rename.
    if (original.text === null) { linkSync(temporary, file); unlinkSync(temporary); }
    else renameSync(temporary, file);
    return { changed: true };
  } finally {
    if (tempFd !== undefined) closeSync(tempFd);
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    closeSync(lockFd); unlinkSync(lock);
  }
}
